// src/services/scheduler.service.ts
import cron from 'node-cron';
import { Booking } from '../database/models/booking.model';
import { Client } from '../database/models/client.model';
import { Procedure } from '../database/models/procedure.model';
import { sendEmailByTrigger } from './mailing.service';

interface Worker {
  _id: string;
  name: string;
  email: string;
}

/**
 * Initialize scheduled tasks
 */
export function initializeScheduler(): void {
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[scheduler] Running daily booking reminders...');
    await sendUpcomingBookingReminders();
  });

  console.log('[scheduler] Scheduler initialized - reminders will run daily at 08:00 AM');
}

/**
 * Send reminders for today's confirmed bookings
 */
async function sendUpcomingBookingReminders(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all confirmed bookings starting today
    const bookings = await Booking.find({
      status: 'confirmed',
      startsAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('clientId')
      .populate('procedureId')
      .lean();

    console.log(`[scheduler] Found ${bookings.length} bookings for today`);

    for (const booking of bookings) {
      await sendReminderEmail(booking);
    }

    console.log(`[scheduler] Sent reminders for ${bookings.length} bookings`);
  } catch (error) {
    console.error('[scheduler] Failed to send booking reminders:', error);
  }
}

/**
 * Send reminder email for a single booking
 */
async function sendReminderEmail(booking: any): Promise<void> {
  try {
    const client = booking.clientId as any;
    const procedure = booking.procedureId as any;

    if (!client || !procedure) {
      console.warn('[scheduler] Missing client or procedure data for booking:', booking._id);
      return;
    }

    // Fetch worker data
    let worker: Worker | null = null;
    try {
      const workerResponse = await fetch(`http://localhost:4000/api/clients/${booking.workerId}`);
      if (workerResponse.ok) {
        worker = await workerResponse.json() as Worker;
      }
    } catch (error) {
      console.warn('[scheduler] Failed to fetch worker data:', error);
    }

    const time = formatTime(booking.startsAt);

    // Send to client
    await sendEmailByTrigger('UPCOMING_BOOKING', {
      client: client.email,
      worker: worker?.email
    }, {
      recipientName: client.name,
      procedureName: procedure.name,
      time,
      clientName: client.name,
      workerName: worker?.name || 'Unknown'
    });
  } catch (error) {
    console.error('[scheduler] Failed to send reminder for booking:', booking._id, error);
  }
}

/**
 * Format time for display
 */
function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Manual trigger for testing - send reminders for today
 */
export async function triggerUpcomingReminders(): Promise<void> {
  console.log('[scheduler] Manually triggering upcoming booking reminders...');
  await sendUpcomingBookingReminders();
}
