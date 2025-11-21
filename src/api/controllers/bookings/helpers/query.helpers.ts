// src/api/controllers/bookings/helpers/query.helpers.ts
import { Booking } from '../../../../database/models/booking.model';
import { createDateRange, createDateRangeFilter } from './date.helpers';
import { getClientIdsByName, getWorkerIdsByName } from './filter.helpers';

export const buildBookingFilter = async (queryParams: any) => {
  const { date, clientName, workerName, dateFrom, dateTo } = queryParams;
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
};

export const applyNameFilters = async (
  query: any,
  clientName?: string,
  workerName?: string
) => {
  if (clientName) {
    const clientIds = await getClientIdsByName(String(clientName));
    query = query.where('clientId').in(clientIds);
  }

  if (workerName) {
    const workerIds = await getWorkerIdsByName(String(workerName));
    query = query.where('workerId').in(workerIds);
  }

  return query;
};
