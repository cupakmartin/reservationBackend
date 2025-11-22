// services/mailing-service/database.js
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon'

async function connectDatabase() {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('[mailing-service] Connected to MongoDB:', MONGO_URI)
    } catch (error) {
        console.error('[mailing-service] MongoDB connection error:', error.message)
        process.exit(1)
    }
}

module.exports = { connectDatabase }
