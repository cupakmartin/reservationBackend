import { Schema, model, Types } from 'mongoose'

const BookingSchema = new Schema({
    clientId: { type: Types.ObjectId, ref: 'Client', required: true },
    workerId: { type: Types.ObjectId, ref: 'Client', required: true },
    procedureId: { type: Types.ObjectId, ref: 'Procedure', required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ['held','confirmed','fulfilled','cancelled'], required: true },
    paymentType: { type: String, enum: ['cash','card','deposit'], required: true },
    previousStatus: { type: String, required: false },
    finalPrice: { type: Number, required: true }
}, { timestamps: true })

export const Booking = model('Booking', BookingSchema)
