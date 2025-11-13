import { Router } from 'express'
import { validate, createBookingSchema, updateBookingSchema } from '../../../middleware/validation'
import { 
    getAllBookings, 
    getBookingById,
    createBooking, 
    updateBooking,
    deleteBooking,
    updateBookingStatus 
} from './bookings.controller'

const router = Router()

router.get('/', getAllBookings)
router.get('/:id', getBookingById)
router.post('/', validate(createBookingSchema), createBooking)
router.put('/:id', validate(updateBookingSchema), updateBooking)
router.delete('/:id', deleteBooking)
router.patch('/:id/status/:newStatus', updateBookingStatus)

export default router
