import nodemailer from 'nodemailer'

export async function sendEmail(to: string | undefined, subject: string, html: string) {
    if (!to) return
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false
    })
    await transporter.sendMail({ from: 'no-reply@glowflow.test', to, subject, html })
}
