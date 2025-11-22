const CommissionRate = require('../models/CommissionRate');
const Payout = require('../models/Payout');
const mongoose = require('mongoose');

const getCommissionRate = async (workerId) => {
  const rate = await CommissionRate.findOne({ workerId });
  return rate ? rate.rate : 0.5;
};

const setCommissionRate = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { rate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ 
        message: 'Invalid worker ID' 
      });
    }

    const commissionRate = await CommissionRate.findOneAndUpdate(
      { workerId },
      { workerId, rate, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ 
      message: 'Commission rate updated', 
      commissionRate 
    });
  } catch (error) {
    console.error('Error setting commission rate:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getWorkerReport = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ 
        message: 'Invalid worker ID' 
      });
    }

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const Booking = mongoose.model('Booking');
    const bookings = await Booking.find({
      workerId,
      status: 'fulfilled',
      startsAt: { $gte: periodStart, $lte: periodEnd }
    }).populate('procedureId', 'name').populate('clientId', 'name');

    const commissionRate = await getCommissionRate(workerId);

    const breakdown = bookings.map(booking => ({
      bookingId: booking._id,
      date: booking.startsAt,
      clientName: booking.clientId?.name || 'Unknown',
      procedureName: booking.procedureId?.name || 'Unknown',
      price: booking.finalPrice,
      commission: booking.finalPrice * commissionRate
    }));

    const totalEarnings = breakdown.reduce((sum, item) => sum + item.commission, 0);

    res.json({
      workerId,
      period: { start: periodStart, end: periodEnd },
      commissionRate,
      totalBookings: bookings.length,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      breakdown
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getAllWorkersReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const periodStart = new Date(targetYear, targetMonth - 1, 1);
    const periodEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const Client = mongoose.model('Client');
    const workers = await Client.find({ role: 'worker' }).select('_id name');

    const reports = await Promise.all(
      workers.map(async (worker) => {
        const Booking = mongoose.model('Booking');
        const bookings = await Booking.find({
          workerId: worker._id,
          status: 'fulfilled',
          startsAt: { $gte: periodStart, $lte: periodEnd }
        });

        const commissionRate = await getCommissionRate(worker._id);
        const totalEarnings = bookings.reduce(
          (sum, b) => sum + (b.finalPrice * commissionRate), 
          0
        );

        return {
          workerId: worker._id,
          workerName: worker.name,
          commissionRate,
          totalBookings: bookings.length,
          totalEarnings: parseFloat(totalEarnings.toFixed(2))
        };
      })
    );

    res.json({
      period: { start: periodStart, end: periodEnd },
      workers: reports
    });
  } catch (error) {
    console.error('Error generating all workers report:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const createPayout = async (req, res) => {
  try {
    const { workerId, amount, periodStart, periodEnd, status } = req.body;

    const payout = new Payout({
      workerId,
      amount,
      periodStart,
      periodEnd,
      status: status || 'pending'
    });

    await payout.save();

    res.status(201).json({ 
      message: 'Payout created', 
      payout 
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    const payout = await Payout.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!payout) {
      return res.status(404).json({ 
        message: 'Payout not found' 
      });
    }

    res.json({ 
      message: 'Payout status updated', 
      payout 
    });
  } catch (error) {
    console.error('Error updating payout:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

module.exports = {
  setCommissionRate,
  getWorkerReport,
  getAllWorkersReport,
  createPayout,
  updatePayoutStatus
};
