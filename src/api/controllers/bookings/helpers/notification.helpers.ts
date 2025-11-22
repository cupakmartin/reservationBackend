// src/api/controllers/bookings/helpers/notification.helpers.ts
import { Client } from '../../../../database/models/client.model';
import { Procedure } from '../../../../database/models/procedure.model';
import { sendEmailByTrigger } from '../../../../services/mailing.service';

/**
 * Send notifications when a booking is created
 */
export const sendBookingNotifications = async (booking: any) => {
  try {
    const client = await Client.findById(booking.clientId);
    const procedure = await Procedure.findById(booking.procedureId);
    const worker = await Client.findById(booking.workerId);
    
    if (!client || !procedure) {
      console.warn('[notifications] Missing client or procedure data');
      return;
    }

    const emailData = {
      procedureName: procedure.name,
      date: formatDate(booking.startsAt),
      time: formatTime(booking.startsAt),
      clientName: client.name,
      workerName: worker?.name || 'Unknown',
      duration: (procedure as any).durationMin?.toString() || 'N/A',
      price: booking.finalPrice?.toString() || procedure.price?.toString() || '0',
      recipientName: '' // Will be set per role
    };

    await sendEmailByTrigger('BOOKING_CREATED', {
      client: client.email,
      worker: worker?.email,
      admin: process.env.OWNER_EMAIL
    }, {
      ...emailData,
      recipientName: client.name
    });
  } catch (error) {
    console.error('[notifications] Failed to send booking created emails:', error);
  }
};

/**
 * Send notification when booking is confirmed
 */
export const sendBookingConfirmedNotification = async (booking: any) => {
  try {
    const client = await Client.findById(booking.clientId);
    const procedure = await Procedure.findById(booking.procedureId);
    const worker = await Client.findById(booking.workerId);
    
    if (!client || !procedure) return;

    await sendEmailByTrigger('BOOKING_CONFIRMED', {
      client: client.email
    }, {
      clientName: client.name,
      procedureName: procedure.name,
      date: formatDate(booking.startsAt),
      time: formatTime(booking.startsAt),
      workerName: worker?.name || 'Unknown',
      duration: (procedure as any).durationMin?.toString() || 'N/A'
    });
  } catch (error) {
    console.error('[notifications] Failed to send booking confirmed email:', error);
  }
};

/**
 * Send notification when booking is completed
 */
export const sendBookingCompletedNotification = async (booking: any) => {
  try {
    const client = await Client.findById(booking.clientId);
    const procedure = await Procedure.findById(booking.procedureId);
    const worker = await Client.findById(booking.workerId);
    
    if (!client || !procedure) return;

    await sendEmailByTrigger('BOOKING_COMPLETED', {
      admin: process.env.OWNER_EMAIL
    }, {
      procedureName: procedure.name,
      clientName: client.name,
      workerName: worker?.name || 'Unknown',
      date: formatDate(booking.startsAt),
      price: booking.finalPrice?.toString() || procedure.price?.toString() || '0'
    });
  } catch (error) {
    console.error('[notifications] Failed to send booking completed email:', error);
  }
};

// Helper functions
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
