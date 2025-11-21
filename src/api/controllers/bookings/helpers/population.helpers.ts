// src/api/controllers/bookings/helpers/population.helpers.ts
import { Client } from '../../../../database/models/client.model';
import mongoose from 'mongoose';

export const populateWorkerData = async (bookings: any[]) => {
  const workerIds = [...new Set(bookings.map(b => b.workerId).filter(Boolean))];
  const workers = await Client.find({ _id: { $in: workerIds } }).select('_id name').lean();
  const workerMap = new Map(
    workers.map(w => [
      (w._id as mongoose.Types.ObjectId).toString(), 
      w
    ])
  );

  return bookings.map(booking => {
    const bookingObj = typeof booking.toObject === 'function' ? booking.toObject() : booking;
    if (bookingObj.workerId) {
      const workerId = bookingObj.workerId instanceof mongoose.Types.ObjectId 
        ? bookingObj.workerId.toString() 
        : String(bookingObj.workerId);
      const worker = workerMap.get(workerId);
      bookingObj.workerId = worker || null;
    }
    return bookingObj;
  });
};
