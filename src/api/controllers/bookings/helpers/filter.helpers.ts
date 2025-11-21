// src/api/controllers/bookings/helpers/filter.helpers.ts
import { Client } from '../../../../database/models/client.model';

export const getClientIdsByName = async (clientName: string) => {
  const clients = await Client.find({
    name: { $regex: clientName, $options: 'i' }
  }).select('_id');
  return clients.map(c => c._id);
};

export const getWorkerIdsByName = async (workerName: string) => {
  const workers = await Client.find({
    name: { $regex: workerName, $options: 'i' },
    role: 'worker'
  }).select('_id');
  return workers.map(w => w._id);
};
