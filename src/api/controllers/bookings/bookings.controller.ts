import { Response, NextFunction } from 'express'
import { Booking } from '../../../database/models/booking.model'
import { Procedure } from '../../../database/models/procedure.model'
import { Material } from '../../../database/models/material.model'
import { Client } from '../../../database/models/client.model'
import { updateClientTier } from '../../../services/loyalty.service'
import { sendEmail } from '../../../services/mailing.service'
import { emitBookingUpdate } from '../../../websocket'
import { AuthRequest } from '../../../middleware/auth'
import mongoose from 'mongoose'

export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Admin only - see all bookings
        const bookings = await Booking.find()
            .populate('clientId')
            .populate('workerId')
            .populate('procedureId')
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export const getWorkerSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bookings = await Booking.find({ workerId: req.user?.userId })
            .populate('clientId')
            .populate('procedureId')
            .sort({ startsAt: 1 });
        
        res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export const getClientBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bookings = await Booking.find({ clientId: req.user?.userId })
            .populate('workerId')
            .populate('procedureId')
            .sort({ startsAt: -1 });
        
        res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export const getBookingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Clients can only view their own bookings
        if (req.user?.role === 'client' && booking.clientId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(booking);
    } catch (error) {
        next(error);
    }
}

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // If the user is a client, force the booking to be for themselves
        const clientId = req.user?.role === 'client' ? req.user.userId : req.body.clientId
        
        // Fetch client and procedure for discount calculation
        const client = await Client.findById(clientId)
        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }
        
        const procedure = await Procedure.findById(req.body.procedureId)
        if (!procedure) {
            return res.status(404).json({ error: 'Procedure not found' })
        }
        
        // Calculate discount based on loyalty tier
        const discountPercent = getDiscountForTier(client.loyaltyTier)
        const finalPrice = procedure.price * (1 - discountPercent)
        
        const bookingData = {
            ...req.body,
            clientId,
            finalPrice
        }
        
        const booking = await Booking.create(bookingData)
        await sendBookingNotifications(booking)
        
        // Emit WebSocket event
        emitBookingUpdate('created', booking)
        
        res.status(201).json(booking)
    } catch (error) {
        next(error)
    }
}

const getDiscountForTier = (tier: string | null): number => {
    switch (tier) {
        case 'Gold': return 0.2
        case 'Silver': return 0.1
        case 'Bronze': return 0.05
        case 'Worker': return 0.5
        default: return 0
    }
}

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const existingBooking = await Booking.findById(req.params.id);
        
        if (!existingBooking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Clients can only update their own bookings
        if (req.user?.role === 'client') {
            if (existingBooking.clientId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'You can only update your own bookings' });
            }
            // Clients cannot change the clientId or status
            delete req.body.clientId;
            delete req.body.status;
        }
        
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        
        // Emit WebSocket event
        emitBookingUpdate('updated', booking);
        
        res.json(booking);
    } catch (error) {
        next(error);
    }
}

export const deleteBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findById(req.params.id)
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        if (booking.status === 'fulfilled') {
            return res.status(400).json({ error: 'Completed bookings cannot be deleted.' })
        }
        
        await Booking.findByIdAndDelete(req.params.id)
        
        // Emit WebSocket event
        emitBookingUpdate('deleted', { id: req.params.id });
        
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

export const updateBookingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id, newStatus } = req.params
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const booking = await Booking.findById(id)
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }
        
        const currentStatus = booking.status
        
        // Client cancellation check
        if (req.user?.role === 'client') {
            if (currentStatus !== 'held' || newStatus !== 'cancelled') {
                return res.status(403).json({ 
                    error: 'Clients can only cancel bookings with status "held"' 
                })
            }
        }
        
        // Validate state transition for workers/admins
        if (!isValidTransition(currentStatus, newStatus, req.user?.role || '')) {
            const statusNames: Record<string, string> = {
                held: 'Pending',
                confirmed: 'Confirmed',
                fulfilled: 'Completed',
                cancelled: 'Cancelled'
            }
            return res.status(400).json({ 
                error: `Invalid status transition: Cannot go from ${statusNames[currentStatus] || currentStatus} to ${statusNames[newStatus] || newStatus}.` 
            })
        }
        
        // Handle cancellation - store previous status
        if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
            (booking as any).previousStatus = currentStatus
        }
        
        // Handle undo cancellation - clear previous status
        if (currentStatus === 'cancelled' && newStatus !== 'cancelled') {
            (booking as any).previousStatus = undefined
        }
        
        // Track visit changes
        if (newStatus === 'fulfilled' && currentStatus !== 'fulfilled') {
            // Increment visits when transitioning TO fulfilled
            await Client.findByIdAndUpdate(
                booking.clientId,
                { $inc: { visitsCount: 1 } }
            )
            await updateClientTier(String(booking.clientId))
        } else if (newStatus === 'cancelled' && currentStatus === 'fulfilled') {
            // Decrement visits when cancelling a fulfilled booking
            await Client.findByIdAndUpdate(
                booking.clientId,
                { $inc: { visitsCount: -1 } }
            )
            await updateClientTier(String(booking.clientId))
        }
        
        booking.status = newStatus as any
        await booking.save()
        
        if (newStatus === 'fulfilled') {
            await deductMaterialStock(String(booking.procedureId))
        }
        
        // Emit WebSocket event
        emitBookingUpdate('status_changed', booking)
        
        res.json(booking)
    } catch (error) {
        next(error)
    }
}

const isValidTransition = (currentStatus: string, newStatus: string, userRole: string): boolean => {
    // Allow cancellation from any state
    if (newStatus === 'cancelled') return true
    
    // Allow undo cancellation to previous status (held or confirmed)
    if (currentStatus === 'cancelled') {
        return newStatus === 'held' || newStatus === 'confirmed'
    }
    
    // Forward-only state machine for workers/admins
    if (currentStatus === 'held') return newStatus === 'confirmed'
    if (currentStatus === 'confirmed') return newStatus === 'fulfilled'
    if (currentStatus === 'fulfilled') return false
    
    return false
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

export const getCalendar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { month, year } = req.query
        
        // Validate month and year
        const monthNum = Number(month)
        const yearNum = Number(year)
        
        if (!month || !year || isNaN(monthNum) || isNaN(yearNum)) {
            return res.status(400).json({ 
                error: 'Invalid parameters',
                message: 'Month and year are required and must be valid numbers'
            })
        }
        
        if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ 
                error: 'Invalid month',
                message: 'Month must be between 1 and 12'
            })
        }
        
        // Calculate date range for the month
        const startDate = new Date(yearNum, monthNum - 1, 1)
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999)
        
        // Get all bookings for the specified month
        const bookings = await Booking.find({
            startsAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).select('startsAt status')
        
        // Extract unique dates with bookings
        const bookedDates = [...new Set(
            bookings.map((booking: any) => {
                const date = new Date(booking.startsAt)
                // Return date in YYYY-MM-DD format
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            })
        )].sort()
        
        // Count bookings per date for additional info
        const dateStats = bookings.reduce((acc: any, booking: any) => {
            const date = new Date(booking.startsAt)
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            
            if (!acc[dateKey]) {
                acc[dateKey] = { total: 0, byStatus: {} }
            }
            
            acc[dateKey].total++
            acc[dateKey].byStatus[booking.status] = (acc[dateKey].byStatus[booking.status] || 0) + 1
            
            return acc
        }, {} as Record<string, { total: number; byStatus: Record<string, number> }>)
        
        res.json({
            month: monthNum,
            year: yearNum,
            dates: bookedDates,
            stats: dateStats
        })
    } catch (error) {
        next(error)
    }
}
