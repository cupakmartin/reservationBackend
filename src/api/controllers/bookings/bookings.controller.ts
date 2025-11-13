import { Request, Response, NextFunction } from 'express'
import { Booking } from '../../../database/models/booking.model'
import { Procedure } from '../../../database/models/procedure.model'
import { Material } from '../../../database/models/material.model'
import { Client } from '../../../database/models/client.model'
import { applyLoyaltyAfterFulfilled } from '../../../services/loyalty.service'
import { sendEmail } from '../../../services/notification.service'
import mongoose from 'mongoose'

export const getAllBookings = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(50)
        res.json(bookings)
    } catch (error) {
        next(error)
    }
}

export const getBookingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findById(req.params.id)
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        res.json(booking)
    } catch (error) {
        next(error)
    }
}

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const booking = await Booking.create(req.body)
        await sendBookingNotifications(booking)
        res.status(201).json(booking)
    } catch (error) {
        next(error)
    }
}

export const updateBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        )
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        res.json(booking)
    } catch (error) {
        next(error)
    }
}

export const deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findByIdAndDelete(req.params.id)
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        res.json({ ok: true, message: 'Booking deleted' })
    } catch (error) {
        next(error)
    }
}

const sendBookingNotifications = async (booking: any) => {
    const client = await Client.findById(booking.clientId)
    const clientEmail = client?.email
    const clientName = client?.name || booking.clientId
    
    if (clientEmail) {
        await sendEmail(
            clientEmail, 
            'Your booking', 
            `<p>Status: <b>${booking.status}</b></p>`
        )
    }
    
    if (process.env.OWNER_EMAIL) {
        await sendEmail(
            process.env.OWNER_EMAIL, 
            'New booking', 
            `<p>Client: ${clientName}</p>`
        )
    }
}

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, newStatus } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findById(id)
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        booking.status = newStatus as any
        await booking.save()
        
        if (newStatus === 'fulfilled') {
            await handleFulfilledBooking(booking)
        }
        
        res.json(booking)
    } catch (error) {
        next(error)
    }
}

const handleFulfilledBooking = async (booking: any) => {
    await deductMaterialStock(booking.procedureId)
    await applyLoyaltyAfterFulfilled(String(booking.clientId))
}

const deductMaterialStock = async (procedureId: string) => {
    const procedure = await Procedure.findById(procedureId)
    
    if (procedure) {
        for (const item of procedure.bom) {
            await Material.updateOne(
                { _id: item.materialId }, 
                { $inc: { stockOnHand: -Number(item.qtyPerProcedure) } }
            )
        }
    }
}
