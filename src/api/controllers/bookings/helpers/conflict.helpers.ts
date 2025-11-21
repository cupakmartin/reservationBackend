// src/api/controllers/bookings/helpers/conflict.helpers.ts
import { Booking } from '../../../../database/models/booking.model';

export const hasUserConflict = async (
  userId: string,
  startsAt: Date,
  endsAt: Date,
  excludeBookingId?: string
): Promise<boolean> => {
  const query: any = buildConflictQuery(userId, startsAt, endsAt);

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  return !!conflictingBooking;
};

const buildConflictQuery = (userId: string, startsAt: Date, endsAt: Date) => {
  return {
    $or: [
      { workerId: userId },
      { clientId: userId }
    ],
    status: { $ne: 'cancelled' },
    $and: [
      {
        $or: [
          { startsAt: { $lte: startsAt }, endsAt: { $gt: startsAt } },
          { startsAt: { $lt: endsAt }, endsAt: { $gte: endsAt } },
          { startsAt: { $gte: startsAt }, endsAt: { $lte: endsAt } }
        ]
      }
    ]
  };
};
