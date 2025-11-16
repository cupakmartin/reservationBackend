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
        const { date, clientName, workerName, dateFrom, dateTo, sortBy = 'createdAt', order = 'desc' } = req.query;
        
        // Build filter query
        const filter: Record<string, unknown> = {};
        
        // If date is provided, allow all authenticated users to see bookings for that date
        if (date) {
            const dateStr = String(date);
            const startOfDay = new Date(dateStr);
            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.startsAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        } else {
            // Date range filtering
            if (dateFrom || dateTo) {
                filter.startsAt = {};
                if (dateFrom) {
                    (filter.startsAt as Record<string, Date>).$gte = new Date(String(dateFrom));
                }
                if (dateTo) {
                    const endDate = new Date(String(dateTo));
                    endDate.setHours(23, 59, 59, 999);
                    (filter.startsAt as Record<string, Date>).$lte = endDate;
                }
            }
        }
        
        // Get bookings with filter
        let bookingsQuery = Booking.find(filter)
            .populate('clientId')
            .populate('workerId')
            .populate('procedureId');
        
        // Apply client name filter
        if (clientName) {
            const clients = await Client.find({
                name: { $regex: String(clientName), $options: 'i' }
            }).select('_id');
            const clientIds = clients.map(c => c._id);
            bookingsQuery = bookingsQuery.where('clientId').in(clientIds);
        }
        
        // Apply worker name filter
        if (workerName) {
            const workers = await Client.find({
                name: { $regex: String(workerName), $options: 'i' },
                role: 'worker'
            }).select('_id');
            const workerIds = workers.map(w => w._id);
            bookingsQuery = bookingsQuery.where('workerId').in(workerIds);
        }
        
        // Handle sorting
        let sortOption: Record<string, 1 | -1> = {};
        const sortOrder = order === 'asc' ? 1 : -1;
        
        switch (sortBy) {
            case 'clientName':
                // Will sort after population
                break;
            case 'workerName':
                // Will sort after population
                break;
            case 'price':
                sortOption = { finalPrice: sortOrder };
                break;
            case 'duration':
                // Will sort after population based on procedure duration
                break;
            case 'createdAt':
                sortOption = { createdAt: sortOrder };
                break;
            case 'startsAt':
            default:
                sortOption = { startsAt: sortOrder };
                break;
        }
        
        if (Object.keys(sortOption).length > 0) {
            bookingsQuery = bookingsQuery.sort(sortOption);
        }
        
        // Apply limit only when not filtering by specific date
        if (!date) {
            bookingsQuery = bookingsQuery.limit(500);
        }
        
        let bookings = await bookingsQuery.exec();
        
        // Post-query sorting for populated fields
        if (sortBy === 'clientName') {
            bookings = bookings.sort((a, b) => {
                const nameA = (a.clientId as any)?.name?.toLowerCase() || '';
                const nameB = (b.clientId as any)?.name?.toLowerCase() || '';
                return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            });
        } else if (sortBy === 'workerName') {
            bookings = bookings.sort((a, b) => {
                const nameA = (a.workerId as any)?.name?.toLowerCase() || '';
                const nameB = (b.workerId as any)?.name?.toLowerCase() || '';
                return sortOrder === 1 ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            });
        } else if (sortBy === 'duration') {
            bookings = bookings.sort((a, b) => {
                const durA = (a.procedureId as any)?.durationMin || 0;
                const durB = (b.procedureId as any)?.durationMin || 0;
                return sortOrder === 1 ? durA - durB : durB - durA;
            });
        }
        
        res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export const getWorkerSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bookings = await Booking.find({ workerId: req.user?.userId })
            .populate('clientId')
            .populate('workerId', 'name')
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
            .populate('clientId', 'name')
            .populate('workerId', 'name')
            .populate('procedureId')
            .sort({ startsAt: -1 });
        
        res.json(bookings);
    } catch (error) {
        next(error);
    }
}

export const getWorkerScheduleForDay = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workerId } = req.params;
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date query parameter is required' });
        }
        
        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        
        // Construct date range for the specified day in GMT+1
        const dateStr = String(date);
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Find all bookings for this worker on this day
        const bookings = await Booking.find({
            workerId,
            startsAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .select('startsAt endsAt')
            .sort({ startsAt: 1 });
        
        // Return simplified schedule array
        const schedule = bookings.map(booking => ({
            startsAt: booking.startsAt,
            endsAt: booking.endsAt
        }));
        
        res.json(schedule);
    } catch (error) {
        next(error);
    }
}

export const getMonthlyAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { year, month } = req.params;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
            return res.status(400).json({ error: 'Invalid year or month' });
        }
        
        // Get all procedures to find minimum duration
        const procedures = await Procedure.find();
        if (procedures.length === 0) {
            return res.json([]);
        }
        
        const minDuration = Math.min(...procedures.map(p => p.durationMin));
        
        // Get all workers
        const workers = await Client.find({ role: 'worker' });
        if (workers.length === 0) {
            return res.json([]);
        }
        
        const workerIds = workers.map(w => w._id as mongoose.Types.ObjectId);
        
        // Operating hours: 8:00 to 20:00
        const openingHour = 8;
        const closingHour = 20;
        const operatingMinutes = (closingHour - openingHour) * 60;
        
        // Calculate first and last day of the month
        const firstDay = new Date(yearNum, monthNum, 1);
        const lastDay = new Date(yearNum, monthNum + 1, 0);
        
        const fullyBookedDays: string[] = [];
        
        // Check each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(yearNum, monthNum, day);
            const dayOfWeek = currentDate.getDay();
            
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue;
            }
            
            // Check if day is fully booked
            const isFullyBooked = await isDayFullyBooked(
                currentDate,
                workerIds,
                minDuration,
                operatingMinutes
            );
            
            if (isFullyBooked) {
                // Format date without timezone conversion: YYYY-MM-DD
                const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                console.log(`[Availability] Day ${dateStr} is fully booked`);
                fullyBookedDays.push(dateStr);
            }
        }
        
        console.log(`[Availability] Fully booked days for ${year}-${month}:`, fullyBookedDays);
        res.json(fullyBookedDays);
    } catch (error) {
        next(error);
    }
}

const isDayFullyBooked = async (
    date: Date,
    workerIds: mongoose.Types.ObjectId[],
    minDuration: number,
    operatingMinutes: number
): Promise<boolean> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all bookings for this day
    const bookings = await Booking.find({
        startsAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).sort({ startsAt: 1 });
    
    // Format date without timezone conversion for logging
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    console.log(`[isDayFullyBooked] Checking ${dateStr}, found ${bookings.length} bookings`);
    
    // Calculate total booked minutes per worker
    const workerBookedMinutes = new Map<string, number>();
    
    for (const workerId of workerIds) {
        const workerBookings = bookings.filter(
            b => b.workerId.toString() === workerId.toString()
        );
        
        let totalMinutes = 0;
        for (const booking of workerBookings) {
            const duration = (booking.endsAt.getTime() - booking.startsAt.getTime()) / (1000 * 60);
            totalMinutes += duration;
        }
        
        console.log(`[isDayFullyBooked] Worker ${workerId}: ${totalMinutes}/${operatingMinutes} minutes booked`);
        
        workerBookedMinutes.set(workerId.toString(), totalMinutes);
    }
    
    // Check if all workers are fully booked (no slot for min duration)
    // Check if ALL workers are fully booked for the entire day
    for (const workerId of workerIds) {
        const bookedMinutes = workerBookedMinutes.get(workerId.toString()) || 0;
        const availableMinutes = operatingMinutes - bookedMinutes;
        
        // If any worker has availability, day is not fully booked
        if (availableMinutes >= minDuration) {
            console.log(`[isDayFullyBooked] Worker ${workerId} still has ${availableMinutes} minutes available`);
            return false;
        }
    }
    
    console.log(`[isDayFullyBooked] All workers fully booked - day is fully booked`);
    return true; // All workers are fully booked for entire operating hours
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

// Helper function to check for overlapping bookings
const hasOverlappingBooking = async (
    workerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeBookingId?: string
): Promise<boolean> => {
    const query: any = {
        workerId,
        $or: [
            // New booking starts during an existing booking
            { startsAt: { $lte: startsAt }, endsAt: { $gt: startsAt } },
            // New booking ends during an existing booking
            { startsAt: { $lt: endsAt }, endsAt: { $gte: endsAt } },
            // New booking completely contains an existing booking
            { startsAt: { $gte: startsAt }, endsAt: { $lte: endsAt } }
        ]
    };

    // Exclude current booking when updating
    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const overlappingBooking = await Booking.findOne(query);
    return !!overlappingBooking;
};

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

        // Check for overlapping bookings for the worker
        const startsAt = new Date(req.body.startsAt);
        const endsAt = new Date(req.body.endsAt);
        
        const hasOverlap = await hasOverlappingBooking(
            req.body.workerId,
            startsAt,
            endsAt
        );

        if (hasOverlap) {
            return res.status(409).json({ 
                error: 'Worker already has a booking during this time slot. Please choose a different time or worker.' 
            });
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

        // Check for overlapping bookings if time or worker is being changed
        if (req.body.startsAt || req.body.endsAt || req.body.workerId) {
            const startsAt = req.body.startsAt ? new Date(req.body.startsAt) : existingBooking.startsAt;
            const endsAt = req.body.endsAt ? new Date(req.body.endsAt) : existingBooking.endsAt;
            const workerId = req.body.workerId || existingBooking.workerId.toString();

            const hasOverlap = await hasOverlappingBooking(
                workerId,
                startsAt,
                endsAt,
                req.params.id
            );

            if (hasOverlap) {
                return res.status(409).json({ 
                    error: 'Worker already has a booking during this time slot. Please choose a different time or worker.' 
                });
            }
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
