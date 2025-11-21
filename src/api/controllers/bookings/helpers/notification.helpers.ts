// src/api/controllers/bookings/helpers/notification.helpers.ts
import { Client } from '../../../../database/models/client.model';
import { sendEmail } from '../../../../services/mailing.service';

export const sendBookingNotifications = async (booking: any) => {
  const client = await Client.findById(booking.clientId);
  
  if (client?.email) {
    await sendClientEmail(client.email, booking.status);
  }
  
  await sendOwnerEmail(client?.name || booking.clientId);
};

const sendClientEmail = async (email: string, status: string) => {
  await sendEmail(
    email,
    'Your booking',
    `<p>Status: <b>${status}</b></p>`
  );
};

const sendOwnerEmail = async (clientName: string) => {
  if (process.env.OWNER_EMAIL) {
    await sendEmail(
      process.env.OWNER_EMAIL,
      'New booking',
      `<p>Client: ${clientName}</p>`
    );
  }
};
