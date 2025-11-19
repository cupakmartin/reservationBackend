import { Router } from 'express'
import { authenticate, checkRole } from '../../../middleware/auth'
import { createReview, getWorkerReviews, getBookingReview, getMyReviews, getAllReviews } from './reviews.controller'

const router = Router()

router.post('/', authenticate, checkRole(['client']), createReview)
router.get('/my-reviews', authenticate, checkRole(['worker']), getMyReviews)
router.get('/all-reviews', authenticate, checkRole(['admin']), getAllReviews)
router.get('/worker/:workerId', authenticate, getWorkerReviews)
router.get('/booking/:bookingId', authenticate, getBookingReview)

export default router
