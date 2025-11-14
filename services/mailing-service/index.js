// services/mailing-service/index.js
require('dotenv').config()
const express = require('express')
const nodemailer = require('nodemailer')
const cors = require('cors')

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

// Send email endpoint
app.post('/send-email', async (req, res) => {
    const { to, subject, html } = req.body

    // Validate required fields
    if (!to || !subject || !html) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['to', 'subject', 'html']
        })
    }

    try {
        const info = await transporter.sendMail({
            from: '"GlowFlow Salon" <no-reply@glowflow.test>',
            to,
            subject,
            html
        })

        console.log('[mailing-service] Email sent:', info.messageId)
        console.log('[mailing-service] Preview URL:', nodemailer.getTestMessageUrl(info))

        res.json({ 
            success: true, 
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info)
        })
    } catch (error) {
        console.error('[mailing-service] Failed to send email:', error.message)
        res.status(500).json({ 
            error: 'Failed to send email',
            message: error.message 
        })
    }
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[mailing-service] Error:', err)
    res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
    console.log(`[mailing-service] listening on :${PORT}`)
    console.log(`[mailing-service] SMTP_HOST = ${process.env.SMTP_HOST}`)
    console.log(`[mailing-service] SMTP_PORT = ${process.env.SMTP_PORT}`)
    console.log(`[mailing-service] SMTP_USER = ${process.env.SMTP_USER}`)
})
