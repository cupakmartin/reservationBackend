import { Router } from 'express'
import { validate, createBookingSchema, updateBookingSchema } from '../../../middleware/validation'
import { authenticate, checkRole } from '../../../middleware/auth'
import { 
    getAllBookings, 
    getBookingById,
    createBooking, 
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    getCalendar,
    getWorkerSchedule,
    getClientBookings,
    getWorkerScheduleForDay,
    getMonthlyAvailability,
    getCompletedSchedule,
    getWorkerDashboardStats
} from './bookings.controller'

const router = Router()

// Bookings - date-filtered queries are open to all authenticated users, unfiltered admin only
router.get('/', authenticate, getAllBookings)
router.get('/my-schedule', authenticate, checkRole(['worker', 'admin']), getWorkerSchedule)
router.get('/completed-schedule', authenticate, checkRole(['worker', 'admin']), getCompletedSchedule)
router.get('/worker-stats', authenticate, checkRole(['worker', 'admin']), getWorkerDashboardStats)
router.get('/my-bookings', authenticate, getClientBookings)
router.get('/calendar', authenticate, getCalendar)
router.get('/availability/:year/:month', authenticate, getMonthlyAvailability)
router.get('/schedule/:workerId', authenticate, getWorkerScheduleForDay)
router.get('/:id', authenticate, getBookingById)

// All authenticated users can create bookings
router.post('/', authenticate, validate(createBookingSchema), createBooking)

// Clients can update their own bookings, workers/admins can update any
router.put('/:id', authenticate, validate(updateBookingSchema), updateBooking)

// Workers and admins can delete bookings
router.delete('/:id', authenticate, checkRole(['admin', 'worker']), deleteBooking)

// All authenticated users can update booking status (with role restrictions in controller)
router.patch('/:id/status/:newStatus', authenticate, updateBookingStatus)

export default router
