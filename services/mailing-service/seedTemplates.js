// services/mailing-service/seedTemplates.js
const EmailConfig = require('./models/EmailConfig')

const defaultTemplates = [
    {
        trigger: 'BOOKING_CREATED',
        subject: 'New Booking Created - {{procedureName}}',
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #4f46e5;">New Booking Created</h2>' +
            '<p>Hello {{recipientName}},</p>' +
            '<p>A new booking has been created:</p>' +
            '<ul>' +
            '<li><strong>Service:</strong> {{procedureName}}</li>' +
            '<li><strong>Date:</strong> {{date}}</li>' +
            '<li><strong>Time:</strong> {{time}}</li>' +
            '<li><strong>Client:</strong> {{clientName}}</li>' +
            '<li><strong>Worker:</strong> {{workerName}}</li>' +
            '</ul>' +
            '<p>Please review and confirm the booking.</p>' +
            '<hr style="margin: 20px 0;">' +
            '<p style="color: #666; font-size: 12px;">GlowFlow Salon - Beauty & Wellness</p>' +
            '</div>',
        enabled: true,
        roles: ['client', 'worker']
    },
    {
        trigger: 'BOOKING_CONFIRMED',
        subject: 'Booking Confirmed - {{procedureName}}',
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #10b981;">Booking Confirmed ✓</h2>' +
            '<p>Hello {{clientName}},</p>' +
            '<p>Your booking has been confirmed!</p>' +
            '<ul>' +
            '<li><strong>Service:</strong> {{procedureName}}</li>' +
            '<li><strong>Date:</strong> {{date}}</li>' +
            '<li><strong>Time:</strong> {{time}}</li>' +
            '<li><strong>Worker:</strong> {{workerName}}</li>' +
            '<li><strong>Duration:</strong> {{duration}} minutes</li>' +
            '</ul>' +
            '<p>We look forward to seeing you!</p>' +
            '<hr style="margin: 20px 0;">' +
            '<p style="color: #666; font-size: 12px;">GlowFlow Salon - Beauty & Wellness</p>' +
            '</div>',
        enabled: true,
        roles: ['client']
    },
    {
        trigger: 'BOOKING_COMPLETED',
        subject: 'Booking Completed - {{procedureName}}',
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #8b5cf6;">Booking Completed</h2>' +
            '<p>Hello Admin,</p>' +
            '<p>A booking has been marked as completed:</p>' +
            '<ul>' +
            '<li><strong>Service:</strong> {{procedureName}}</li>' +
            '<li><strong>Client:</strong> {{clientName}}</li>' +
            '<li><strong>Worker:</strong> {{workerName}}</li>' +
            '<li><strong>Date:</strong> {{date}}</li>' +
            '<li><strong>Revenue:</strong> ${{price}}</li>' +
            '</ul>' +
            '<p>This transaction has been recorded in the system.</p>' +
            '<hr style="margin: 20px 0;">' +
            '<p style="color: #666; font-size: 12px;">GlowFlow Salon - Admin Notification</p>' +
            '</div>',
        enabled: true,
        roles: ['admin']
    },
    {
        trigger: 'UPCOMING_BOOKING',
        subject: 'Reminder: Booking Today - {{procedureName}}',
        htmlTemplate: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #f59e0b;">Booking Reminder 🔔</h2>' +
            '<p>Hello {{recipientName}},</p>' +
            '<p>This is a reminder that you have a booking <strong>today</strong>:</p>' +
            '<ul>' +
            '<li><strong>Service:</strong> {{procedureName}}</li>' +
            '<li><strong>Time:</strong> {{time}}</li>' +
            '<li><strong>Client:</strong> {{clientName}}</li>' +
            '<li><strong>Worker:</strong> {{workerName}}</li>' +
            '</ul>' +
            '<p>Please arrive 5 minutes early. See you soon!</p>' +
            '<hr style="margin: 20px 0;">' +
            '<p style="color: #666; font-size: 12px;">GlowFlow Salon - Beauty & Wellness</p>' +
            '</div>',
        enabled: true,
        roles: ['client', 'worker']
    }
]

async function seedTemplates() {
    try {
        for (const template of defaultTemplates) {
            const exists = await EmailConfig.findOne({ trigger: template.trigger })
            if (!exists) {
                await EmailConfig.create(template)
                console.log(`[mailing-service] Seeded template: ${template.trigger}`)
            }
        }
        console.log('[mailing-service] Template seeding complete')
    } catch (error) {
        console.error('[mailing-service] Error seeding templates:', error.message)
    }
}

module.exports = { seedTemplates }
