// setup-ethereal.js
// Run this script to generate new Ethereal.email test credentials if needed
const nodemailer = require('nodemailer')

async function setupEthereal() {
    try {
        const testAccount = await nodemailer.createTestAccount()
        
        console.log('\n=== Ethereal Email Test Account ===')
        console.log('Host:', testAccount.smtp.host)
        console.log('Port:', testAccount.smtp.port)
        console.log('Secure:', testAccount.smtp.secure)
        console.log('User:', testAccount.user)
        console.log('Pass:', testAccount.pass)
        console.log('\nWeb Interface:', testAccount.web)
        console.log('\nAdd these to your .env file:')
        console.log(`SMTP_HOST=${testAccount.smtp.host}`)
        console.log(`SMTP_PORT=${testAccount.smtp.port}`)
        console.log(`SMTP_USER=${testAccount.user}`)
        console.log(`SMTP_PASS=${testAccount.pass}`)
        console.log('===================================\n')
    } catch (error) {
        console.error('Error creating test account:', error)
    }
}

setupEthereal()
