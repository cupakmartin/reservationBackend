const WaitlistEntry = require('../models/WaitlistEntry');
const axios = require('axios');

const DATA_API_URL = process.env.DATA_API_URL || 'http://data-api:4000';
const MAILING_SERVICE_URL = process.env.MAILING_SERVICE_URL || 'http://mailing-service:4001';

const addToWaitlist = async (req, res) => {
  try {
    const { date, clientId, workerId, procedureId } = req.body;

    const existing = await WaitlistEntry.findOne({ 
      date, 
      clientId, 
      workerId, 
      procedureId 
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'Already on waitlist' 
      });
    }

    const entry = new WaitlistEntry({ 
      date, 
      clientId, 
      workerId, 
      procedureId 
    });
    await entry.save();

    res.status(201).json({ 
      message: 'Added to waitlist', 
      entry 
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const removeFromWaitlist = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await WaitlistEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ 
        message: 'Entry not found' 
      });
    }

    await WaitlistEntry.findByIdAndDelete(id);

    res.json({ 
      message: 'Removed from waitlist' 
    });
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getClientWaitlist = async (req, res) => {
  try {
    const { clientId } = req.params;

    const entries = await WaitlistEntry.find({ clientId })
      .populate('procedureId', 'name duration price')
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const notifyAvailability = async (req, res) => {
  try {
    const { date, workerId } = req.body;

    const filter = { date };
    if (workerId) {
      filter.workerId = workerId;
    }

    const entries = await WaitlistEntry.find(filter)
      .populate('clientId', 'name email')
      .populate('workerId', 'name')
      .populate('procedureId', 'name');

    if (entries.length === 0) {
      return res.json({ 
        message: 'No entries to notify' 
      });
    }

    const notifications = entries.map(async (entry) => {
      if (!entry.clientId?.email) return null;

      const workerName = entry.workerId?.name || 'any worker';
      const dateStr = new Date(entry.date).toLocaleDateString();

      try {
        await axios.post(`${MAILING_SERVICE_URL}/send`, {
          to: entry.clientId.email,
          subject: 'Slot Available!',
          html: `
            <h2>Great News!</h2>
            <p>Hi ${entry.clientId.name},</p>
            <p>A slot has opened up on <strong>${dateStr}</strong> with <strong>${workerName}</strong> for <strong>${entry.procedureId.name}</strong>.</p>
            <p>Book now before it's taken!</p>
          `
        });
        return entry._id;
      } catch (error) {
        console.error('Failed to send email:', error);
        return null;
      }
    });

    await Promise.all(notifications);

    res.json({ 
      message: `Notified ${entries.length} clients` 
    });
  } catch (error) {
    console.error('Error notifying availability:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

module.exports = {
  addToWaitlist,
  removeFromWaitlist,
  getClientWaitlist,
  notifyAvailability
};
