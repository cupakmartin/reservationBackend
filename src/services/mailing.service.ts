// src/services/mailing.service.ts
// Client for the Mailing Service microservice

const MAILING_SERVICE_URL = process.env.MAILING_SERVICE_URL || 'http://localhost:4001'

export async function sendEmail(to: string | undefined, subject: string, html: string) {
    if (!to) return
    
    try {
        const response = await fetch(`${MAILING_SERVICE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, subject, html })
        })
        
        if (!response.ok) {
            const error = await response.json()
            console.error('[mailing] Failed to send email:', error)
            return
        }
        
        const result = await response.json() as { messageId?: string; previewUrl?: string }
        console.log('[mailing] Email sent:', result.messageId)
        if (result.previewUrl) {
            console.log('[mailing] Preview URL:', result.previewUrl)
        }
    } catch (error) {
        // Log the error but don't throw - email failures shouldn't block operations
        console.error('[mailing] Failed to send email:', error instanceof Error ? error.message : error)
    }
}
