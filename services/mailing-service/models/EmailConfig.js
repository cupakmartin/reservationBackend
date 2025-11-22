// services/mailing-service/models/EmailConfig.js
const mongoose = require('mongoose')

const emailConfigSchema = new mongoose.Schema({
    trigger: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    htmlTemplate: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    roles: {
        type: [String],
        enum: ['client', 'worker', 'admin'],
        default: []
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('EmailConfig', emailConfigSchema)
