// src/api/controllers/bookings/helpers/date.helpers.ts
export const createDateRange = (dateStr: string) => {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

export const createDateRangeFilter = (dateFrom?: string, dateTo?: string) => {
  const filter: { $gte?: Date; $lte?: Date } = {};
  if (dateFrom) {
    filter.$gte = new Date(dateFrom);
  }
  if (dateTo) {
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    filter.$lte = endDate;
  }
  return filter;
};

export const formatDateStr = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
