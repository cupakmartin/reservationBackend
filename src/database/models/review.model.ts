import { Schema, model, Types } from 'mongoose'

const ReviewSchema = new Schema({
    bookingId: { 
        type: Types.ObjectId, 
        ref: 'Booking', 
        required: true,
        unique: true 
    },
    clientId: { 
        type: Types.ObjectId, 
        ref: 'Client', 
        required: true 
    },
    workerId: { 
        type: Types.ObjectId, 
        ref: 'Client', 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5 
    },
    comment: { 
        type: String, 
        required: false 
    }
}, { timestamps: true })

export const Review = model('Review', ReviewSchema)
