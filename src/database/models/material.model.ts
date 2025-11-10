import { Schema, model } from 'mongoose'

const MaterialSchema = new Schema({
    name: { type: String, required: true },
    unit: { type: String, enum: ['ml','g','pcs'], required: true },
    stockOnHand: { type: Number, default: 0 }
}, { timestamps: true })

export const Material = model('Material', MaterialSchema)
