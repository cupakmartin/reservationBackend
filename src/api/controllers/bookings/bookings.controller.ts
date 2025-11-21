import { Response, NextFunction } from 'express'
import { Booking } from '../../../database/models/booking.model'
import { Procedure } from '../../../database/models/procedure.model'
import { Material } from '../../../database/models/material.model'
import { Client } from '../../../database/models/client.model'
import { updateClientTier } from '../../../services/loyalty.service'
import { emitBookingUpdate } from '../../../websocket'
import { AuthRequest } from '../../../middleware/auth'
import mongoose from 'mongoose'
import { populateWorkerData } from './helpers/population.helpers'
import { createDateRange, createDateRangeFilter } from './helpers/date.helpers'
import { getClientIdsByName, getWorkerIdsByName } from './helpers/filter.helpers'
import { createSortOption, sortByPopulatedField } from './helpers/sort.helpers'
import { hasUserConflict } from './helpers/conflict.helpers'
import { calculateFinalPrice } from './helpers/pricing.helpers'
import { sendBookingNotifications } from './helpers/notification.helpers'
import { validateObjectId, checkClientAccess } from './helpers/validation.helpers'

export const getAllBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { date, clientName, workerName, dateFrom, dateTo, sortBy = 'createdAt', order = 'desc' } = req.query;
        
        const filter = buildFilter(date, dateFrom, dateTo);
        let bookingsQuery = Booking.find(filter).populate('clientId').populate('procedureId');
        
        if (clientName) {
            const clientIds = await getClientIdsByName(String(clientName));
            bookingsQuery = bookingsQuery.where('clientId').in(clientIds);
        }
        
        if (workerName) {
            const workerIds = await getWorkerIdsByName(String(workerName));
            bookingsQuery = bookingsQuery.where('workerId').in(workerIds);
        }
        
        bookingsQuery = applySorting(bookingsQuery, sortBy as string, order as string);
        
        if (!date) {
            bookingsQuery = bookingsQuery.limit(500);
        }
        
        let bookings = await bookingsQuery.exec();
        const enrichedBookings = await populateWorkerData(bookings);
        
        sortByPopulatedField(enrichedBookings, sortBy as string, order as string);
        
        res.json(enrichedBookings);
    } catch (error) {
        next(error);
    }
}

const buildFilter = (date: any, dateFrom: any, dateTo: any) => {
    const filter: Record<string, unknown> = {};
    
    if (date) {
        const { startOfDay, endOfDay } = createDateRange(String(date));
        filter.startsAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (dateFrom || dateTo) {
        filter.startsAt = createDateRangeFilter(
            dateFrom ? String(dateFrom) : undefined,
            dateTo ? String(dateTo) : undefined
        );
    }
    
    return filter;
}

const applyFilters = async (query: any, clientName: any, workerName: any) => {
    if (clientName) {
        const clientIds = await getClientIdsByName(String(clientName));
        query = query.where('clientId').in(clientIds);
    }
    
    if (workerName) {
        const workerIds = await getWorkerIdsByName(String(workerName));
        query = query.where('workerId').in(workerIds);
    }
    
    return query;
}

const applySorting = (query: any, sortBy: string, order: string) => {
    if (!['clientName', 'workerName', 'duration'].includes(sortBy)) {
        const sortOption = createSortOption(sortBy, order);
        if (Object.keys(sortOption).length > 0) {
            query = query.sort(sortOption);
        }
    }
    return query;
}

export const getWorkerSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const workerObjectId = new mongoose.Types.ObjectId(req.user?.userId);
        
        const bookings = await Booking.find({ 
            workerId: workerObjectId,
            status: { $ne: 'fulfilled' }
        })
            .populate('clientId')
            .populate('procedureId')
            .sort({ startsAt: 1 })
            .lean();
        
        const enrichedBookings = await populateWorkerData(bookings);
        res.json(enrichedBookings);
    } catch (error) {
        next(error);
    }
}

export const getClientBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const bookings = await Booking.find({ 
            clientId: req.user?.userId,
            status: { $ne: 'fulfilled' }
        })
            .populate('clientId', 'name')
            .populate('procedureId')
            .sort({ startsAt: -1 })
            .lean();
        
        const enrichedBookings = await populateWorkerData(bookings);
        res.json(enrichedBookings);
    } catch (error) {
        next(error);
    }
}

export const getCompletedSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { clientName, date, dateRangeStart, dateRangeEnd, priceSort } = req.query;
        
        const filter = buildCompletedFilter(req.user, date, dateRangeStart, dateRangeEnd);
        let bookingsQuery = Booking.find(filter).populate('clientId').populate('procedureId');
        
        if (clientName) {
            const clientIds = await getClientIdsByName(String(clientName));
            bookingsQuery = bookingsQuery.where('clientId').in(clientIds);
        }
        
        bookingsQuery = applyCompletedSort(bookingsQuery, priceSort);
        
        const bookings = await bookingsQuery.lean();
        const enrichedBookings = await populateWorkerData(bookings);
        
        res.json(enrichedBookings);
    } catch (error) {
        next(error);
    }
}

const buildCompletedFilter = (user: any, date: any, dateRangeStart: any, dateRangeEnd: any) => {
    const filter: Record<string, unknown> = { status: 'fulfilled' };
    
    if (user?.role === 'client') {
        filter.clientId = user.userId;
    } else {
        filter.workerId = user.userId;
    }
    
    if (date) {
        const { startOfDay, endOfDay } = createDateRange(String(date));
        filter.startsAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (dateRangeStart || dateRangeEnd) {
        filter.startsAt = createDateRangeFilter(
            dateRangeStart ? String(dateRangeStart) : undefined,
            dateRangeEnd ? String(dateRangeEnd) : undefined
        );
    }
    
    return filter;
}

const applyCompletedSort = (query: any, priceSort: any) => {
    if (priceSort) {
        const sortOrder = priceSort === 'asc' ? 1 : -1;
        return query.sort({ finalPrice: sortOrder });
    }
    return query.sort({ startsAt: -1 });
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
        
        // Find ALL bookings where this user is occupied (as worker OR client)
        const bookings = await Booking.find({
            $or: [
                { workerId },
                { clientId: workerId }
            ],
            status: { $ne: 'cancelled' },
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
            b => b.workerId && b.workerId.toString() === workerId.toString()
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
        if (!validateObjectId(req.params.id, res, 'Booking')) {
            return;
        }
        
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        if (req.user?.role === 'client' && !checkClientAccess(booking, req.user.userId, res)) {
            return;
        }
        
        res.json(booking);
    } catch (error) {
        next(error);
    }
}

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const clientId = req.user?.role === 'client' ? req.user.userId : req.body.clientId;
        
        const { client, procedure } = await fetchBookingEntities(clientId, req.body.procedureId, res);
        if (!client || !procedure) return;
        
        const { startsAt, endsAt } = extractDates(req.body);
        
        if (await checkBookingConflicts(req.body.workerId, clientId, startsAt, endsAt, res)) {
            return;
        }
        
        const finalPrice = calculateFinalPrice(procedure.price, client.loyaltyTier);
        const bookingData = { ...req.body, clientId, finalPrice };
        
        const booking = await Booking.create(bookingData);
        await sendBookingNotifications(booking);
        emitBookingUpdate('created', booking);
        
        res.status(201).json(booking);
    } catch (error) {
        next(error);
    }
}

const fetchBookingEntities = async (clientId: string, procedureId: string, res: Response) => {
    const client = await Client.findById(clientId);
    if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return {};
    }
    
    const procedure = await Procedure.findById(procedureId);
    if (!procedure) {
        res.status(404).json({ error: 'Procedure not found' });
        return {};
    }
    
    return { client, procedure };
}

const extractDates = (body: any) => ({
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt)
})

const checkBookingConflicts = async (
    workerId: string,
    clientId: string,
    startsAt: Date,
    endsAt: Date,
    res: Response
): Promise<boolean> => {
    const workerConflict = await hasUserConflict(workerId, startsAt, endsAt);
    if (workerConflict) {
        res.status(409).json({ 
            error: 'Worker is not available during this time slot. Please choose a different time or worker.' 
        });
        return true;
    }

    const clientConflict = await hasUserConflict(clientId, startsAt, endsAt);
    if (clientConflict) {
        res.status(409).json({ 
            error: 'You already have a booking during this time slot. Please choose a different time.' 
        });
        return true;
    }
    
    return false;
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

            const workerConflict = await hasUserConflict(
                workerId,
                startsAt,
                endsAt,
                req.params.id
            );

            if (workerConflict) {
                return res.status(409).json({ 
                    error: 'Worker is not available during this time slot. Please choose a different time or worker.' 
                });
            }

            const clientId = existingBooking.clientId.toString();
            const clientConflict = await hasUserConflict(
                clientId,
                startsAt,
                endsAt,
                req.params.id
            );

            if (clientConflict) {
                return res.status(409).json({ 
                    error: 'Client already has a booking during this time slot. Please choose a different time.' 
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
            // Decrement visits when cancelling a fulfilled booking, but never below 0
            const client = await Client.findById(booking.clientId)
            if (client && client.visitsCount > 0) {
                await Client.findByIdAndUpdate(
                    booking.clientId,
                    { $inc: { visitsCount: -1 } }
                )
                await updateClientTier(String(booking.clientId))
            }
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

export const getWorkerDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const workerId = req.user?.userId;
        
        const [personalStats, workStats] = await Promise.all([
            Booking.aggregate([
                { $match: { clientId: new mongoose.Types.ObjectId(workerId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Booking.aggregate([
                { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        
        res.json({ personalStats, workStats });
    } catch (error) {
        next(error);
    }
}

export const getUserCalendarStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        
        if (!userId) {
            res.status(401).json({ error: 'User ID not found' });
            return;
        }
        
        const personalBookings = await Booking.find({
            clientId: new mongoose.Types.ObjectId(userId),
            status: { $ne: 'cancelled' }
        })
        .select('startsAt endsAt')
        .populate('procedureId', 'name')
        .sort({ startsAt: 1 });
        
        const personalDates = personalBookings.map(booking => ({
            date: booking.startsAt.toISOString(),
            startsAt: booking.startsAt.toISOString(),
            endsAt: booking.endsAt.toISOString(),
            procedureName: (booking.procedureId as any)?.name || 'Unknown',
            type: 'personal' as const
        }));
        
        let workDates: any[] = [];
        
        if (userRole === 'worker' || userRole === 'admin') {
            const workBookings = await Booking.find({
                workerId: new mongoose.Types.ObjectId(userId),
                status: { $ne: 'cancelled' }
            })
            .select('startsAt endsAt')
            .populate('procedureId', 'name')
            .sort({ startsAt: 1 });
            
            workDates = workBookings.map(booking => ({
                date: booking.startsAt.toISOString(),
                startsAt: booking.startsAt.toISOString(),
                endsAt: booking.endsAt.toISOString(),
                procedureName: (booking.procedureId as any)?.name || 'Unknown',
                type: 'work' as const
            }));
        }
        
        res.json([...personalDates, ...workDates]);
    } catch (error) {
        next(error);
    }
}

export const getRevenueAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const revenueData = await Booking.aggregate([
            {
                $match: {
                    status: 'fulfilled',
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$finalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json(revenueData);
    } catch (error) {
        next(error);
    }
}

export const getPerformanceAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const performanceData = await Booking.aggregate([
            {
                $match: {
                    status: 'fulfilled'
                }
            },
            {
                $group: {
                    _id: '$workerId',
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$finalPrice' }
                }
            },
            { $sort: { totalBookings: -1 } },
            { $limit: 10 }
        ]);

        const workerIds = performanceData.map(p => p._id);
        const workers = await Client.find({ _id: { $in: workerIds } }).select('name');
        const workerMap = new Map(workers.map(w => [String(w._id), w.name]));

        const enrichedData = performanceData.map(perf => ({
            workerId: perf._id,
            workerName: workerMap.get(perf._id.toString()) || 'Unknown',
            totalBookings: perf.totalBookings,
            totalRevenue: perf.totalRevenue
        }));

        res.json(enrichedData);
    } catch (error) {
        next(error);
    }
}
