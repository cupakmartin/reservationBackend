import { Router } from 'express'
import { validate, createBookingSchema } from '../../../middleware/validation'
import { getAllBookings, createBooking, updateBookingStatus } from './bookings.controller'

const router = Router()

router.get('/', getAllBookings)
router.post('/', validate(createBookingSchema), createBooking)
router.patch('/:id/status/:newStatus', updateBookingStatus)

export default router
