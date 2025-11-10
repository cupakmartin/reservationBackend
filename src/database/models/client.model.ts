import { Schema, model } from 'mongoose'

const ClientSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    visitsCount: { type: Number, default: 0 },
    loyaltyTier: { type: String }
}, { timestamps: true })

export const Client = model('Client', ClientSchema)
