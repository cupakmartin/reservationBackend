import { Response, NextFunction } from 'express'
import { Review } from '../../../database/models/review.model'
import { Booking } from '../../../database/models/booking.model'
import { AuthRequest } from '../../../middleware/auth'
import mongoose from 'mongoose'

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { bookingId, rating, comment } = req.body
        const userId = req.user?.userId
        const userRole = req.user?.role

        if (!userId) {
            return res.status(401).json({ error: 'User ID not found' })
        }

        // Only clients can leave reviews
        if (userRole !== 'client') {
            return res.status(403).json({ error: 'Only clients can leave reviews' })
        }

        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' })
        }

        // Verify the client is the one who made the booking
        if (booking.clientId.toString() !== userId) {
            return res.status(403).json({ error: 'You can only review your own bookings' })
        }

        if (booking.status !== 'fulfilled') {
            return res.status(400).json({ error: 'Can only review fulfilled bookings' })
        }

        // Check for existing review
        const existingReview = await Review.findOne({ bookingId })
        if (existingReview) {
            return res.status(409).json({ error: 'You already reviewed this booking' })
        }

        const review = await Review.create({
            bookingId,
            clientId: userId,
            workerId: booking.workerId,
            rating,
            comment
        })

        res.status(201).json(review)
    } catch (error) {
        next(error)
    }
}

export const getWorkerReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workerId } = req.params

        if (!mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(400).json({ error: 'Invalid worker ID' })
        }

        const reviews = await Review.find({ workerId })
            .populate('clientId', 'name')
            .sort({ createdAt: -1 })

        const stats = await Review.aggregate([
            { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ])

        res.json({
            reviews,
            averageRating: stats[0]?.averageRating || 0,
            totalReviews: stats[0]?.totalReviews || 0
        })
    } catch (error) {
        next(error)
    }
}

export const getBookingReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.params
        const review = await Review.findOne({ bookingId })
        res.json(review)
    } catch (error) {
        next(error)
    }
}

export const getMyReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const workerId = req.user?.userId

        const reviews = await Review.find({ workerId })
            .populate('clientId', 'name email avatarUrl')
            .populate('bookingId', 'startsAt procedureId')
            .sort({ createdAt: -1 })
            .lean()

        // Populate procedure details
        const reviewsWithProcedures = await Promise.all(
            reviews.map(async (review: any) => {
                if (review.bookingId?.procedureId) {
                    const Procedure = (await import('../../../database/models/procedure.model')).Procedure
                    const procedure = await Procedure.findById(review.bookingId.procedureId).lean()
                    review.bookingId.procedure = procedure
                }
                return review
            })
        )

        const stats = await Review.aggregate([
            { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ])

        res.json({
            reviews: reviewsWithProcedures,
            stats: stats[0] || {
                averageRating: 0,
                totalReviews: 0,
                fiveStars: 0,
                fourStars: 0,
                threeStars: 0,
                twoStars: 0,
                oneStar: 0
            }
        })
    } catch (error) {
        next(error)
    }
}

export const getAllReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { workerName } = req.query

        let query: any = {}

        // Filter by worker name if provided
        if (workerName) {
            const Client = (await import('../../../database/models/client.model')).Client
            const workers = await Client.find({
                role: 'worker',
                name: { $regex: String(workerName), $options: 'i' }
            }).select('_id')
            const workerIds = workers.map(w => w._id)
            query.workerId = { $in: workerIds }
        }

        const reviews = await Review.find(query)
            .populate('clientId', 'name email avatarUrl')
            .populate('workerId', 'name email avatarUrl')
            .populate('bookingId', 'startsAt procedureId')
            .sort({ createdAt: -1 })
            .lean()

        // Populate procedure details
        const reviewsWithProcedures = await Promise.all(
            reviews.map(async (review: any) => {
                if (review.bookingId?.procedureId) {
                    const Procedure = (await import('../../../database/models/procedure.model')).Procedure
                    const procedure = await Procedure.findById(review.bookingId.procedureId).lean()
                    review.bookingId.procedure = procedure
                }
                return review
            })
        )

        const stats = await Review.aggregate([
            ...(Object.keys(query).length > 0 ? [{ $match: query }] : []),
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
                }
            }
        ])

        res.json({
            reviews: reviewsWithProcedures,
            stats: stats[0] || {
                averageRating: 0,
                totalReviews: 0,
                fiveStars: 0,
                fourStars: 0,
                threeStars: 0,
                twoStars: 0,
                oneStar: 0
            }
        })
    } catch (error) {
        next(error)
    }
}
