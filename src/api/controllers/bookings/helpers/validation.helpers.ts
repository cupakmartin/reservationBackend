// src/api/controllers/bookings/helpers/validation.helpers.ts
import mongoose from 'mongoose';
import { Response } from 'express';

export const validateObjectId = (id: string, res: Response, entityName: string = 'Resource'): boolean => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).json({ error: `${entityName} not found` });
    return false;
  }
  return true;
};

export const validateDateParams = (year: string, month: string, res: Response) => {
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    res.status(400).json({ error: 'Invalid year or month' });
    return null;
  }

  return { yearNum, monthNum: monthNum - 1 };
};

export const checkClientAccess = (booking: any, userId: string, res: Response): boolean => {
  if (booking.clientId.toString() !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return false;
  }
  return true;
};
