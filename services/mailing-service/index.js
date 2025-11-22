// services/mailing-service/index.js
require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const cors = require('cors')
const { connectDatabase } = require('./database')
const { seedTemplates } = require('./seedTemplates')
const EmailConfig = require('./models/EmailConfig')
const { renderTemplate } = require('./utils/templateEngine')

const app = express()
const PORT = process.env.PORT || 4001

// Middleware
app.use(cors())
app.use(express.json())

// Configure nodemailer transporter with Ethereal credentials
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'mailing-service' })
})

// Send email endpoint (NEW: Trigger-based with roles)
app.post('/send-email', async (req, res) => {
    const { trigger, recipients, data } = req.body

    // Validate required fields
    if (!trigger || !recipients || !data) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['trigger', 'recipients', 'data']
        })
    }

    try {
        // Find email configuration by trigger
        const config = await EmailConfig.findOne({ trigger })
        
        if (!config) {
            console.log(`[mailing-service] No config found for trigger: ${trigger}`)
            return res.json({ success: true, message: 'No email configuration found' })
        }

        if (!config.enabled) {
            console.log(`[mailing-service] Email disabled for trigger: ${trigger}`)
            return res.json({ success: true, message: 'Email notifications disabled' })
        }

        const sentEmails = []

        // Send emails based on configured roles
        for (const role of config.roles) {
            const recipientEmail = recipients[role]
            
            if (!recipientEmail) {
                console.log(`[mailing-service] No recipient for role: ${role}`)
                continue
            }

            // Render template with data
            const subject = renderTemplate(config.subject, data)
            const html = renderTemplate(config.htmlTemplate, data)

            // Send email
            const info = await transporter.sendMail({
                from: '"GlowFlow Salon" <no-reply@glowflow.test>',
                to: recipientEmail,
                subject,
                html
            })

            console.log(`[mailing-service] Email sent to ${role}:`, info.messageId)
            const previewUrl = nodemailer.getTestMessageUrl(info)
            if (previewUrl) {
                console.log(`[mailing-service] Preview URL:`, previewUrl)
            }

            sentEmails.push({
                role,
                email: recipientEmail,
                messageId: info.messageId,
                previewUrl
            })
        }

        res.json({ 
            success: true, 
            trigger,
            sentCount: sentEmails.length,
            emails: sentEmails
        })
    } catch (error) {
        console.error('[mailing-service] Failed to send email:', error.message)
        res.status(500).json({ 
            error: 'Failed to send email',
            message: error.message 
        })
    }
})

// Get all email templates
app.get('/templates', async (req, res) => {
    try {
        const templates = await EmailConfig.find().sort({ trigger: 1 })
        res.json({ success: true, templates })
    } catch (error) {
        console.error('[mailing-service] Failed to fetch templates:', error.message)
        res.status(500).json({ 
            error: 'Failed to fetch templates',
            message: error.message 
        })
    }
})

// Update email template
app.put('/templates/:trigger', async (req, res) => {
    const { trigger } = req.params
    const { subject, htmlTemplate, enabled, roles } = req.body

    try {
        // Validate input
        if (!subject || subject.trim().length === 0) {
            return res.status(400).json({ error: 'Subject cannot be empty' })
        }

        if (!htmlTemplate || htmlTemplate.trim().length === 0) {
            return res.status(400).json({ error: 'HTML template cannot be empty' })
        }

        if (roles && !Array.isArray(roles)) {
            return res.status(400).json({ error: 'Roles must be an array' })
        }

        if (roles && roles.some(r => !['client', 'worker', 'admin'].includes(r))) {
            return res.status(400).json({ 
                error: 'Invalid role',
                allowed: ['client', 'worker', 'admin']
            })
        }

        const updateData = {}
        if (subject !== undefined) updateData.subject = subject.trim()
        if (htmlTemplate !== undefined) updateData.htmlTemplate = htmlTemplate.trim()
        if (enabled !== undefined) updateData.enabled = enabled
        if (roles !== undefined) updateData.roles = roles

        const template = await EmailConfig.findOneAndUpdate(
            { trigger },
            updateData,
            { new: true, runValidators: true }
        )

        if (!template) {
            return res.status(404).json({ error: 'Template not found' })
        }

        console.log(`[mailing-service] Updated template: ${trigger}`)
        res.json({ success: true, template })
    } catch (error) {
        console.error('[mailing-service] Failed to update template:', error.message)
        res.status(500).json({ 
            error: 'Failed to update template',
            message: error.message 
        })
    }
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[mailing-service] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
})

// Initialize and start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase()
        
        // Seed default templates
        await seedTemplates()
        
        // Start server
        app.listen(PORT, () => {
            console.log(`[mailing-service] listening on :${PORT}`)
            console.log(`[mailing-service] SMTP_HOST = ${process.env.SMTP_HOST}`)
            console.log(`[mailing-service] SMTP_PORT = ${process.env.SMTP_PORT}`)
            console.log(`[mailing-service] SMTP_USER = ${process.env.SMTP_USER}`)
        })
    } catch (error) {
        console.error('[mailing-service] Failed to start server:', error)
        process.exit(1)
    }
}

startServer()

