import { Router } from 'express'
import { validate, createBookingSchema, updateBookingSchema } from '../../../middleware/validation'
import { authenticate, checkRole } from '../../../middleware/auth'
import { 
    getAllBookings, 
    getBookingById,
    createBooking, 
    updateBooking,
    deleteBooking,
    updateBookingStatus 
} from './bookings.controller'

const router = Router()

// Workers and admins can view all bookings, clients see filtered results in controller
router.get('/', authenticate, getAllBookings)
router.get('/:id', authenticate, getBookingById)

// All authenticated users can create bookings
router.post('/', authenticate, validate(createBookingSchema), createBooking)

// Clients can update their own bookings, workers/admins can update any
router.put('/:id', authenticate, validate(updateBookingSchema), updateBooking)

// Only admins can delete bookings
router.delete('/:id', authenticate, checkRole(['admin']), deleteBooking)

// Workers and admins can update booking status
router.patch('/:id/status/:newStatus', authenticate, checkRole(['worker', 'admin']), updateBookingStatus)

export default router
