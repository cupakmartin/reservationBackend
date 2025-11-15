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
    getClientBookings
} from './bookings.controller'

const router = Router()

// Admin only - view all bookings
router.get('/', authenticate, checkRole(['admin']), getAllBookings)
router.get('/my-schedule', authenticate, checkRole(['worker']), getWorkerSchedule)
router.get('/my-bookings', authenticate, getClientBookings)
router.get('/calendar', authenticate, getCalendar)
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
