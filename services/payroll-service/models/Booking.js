const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  procedureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Procedure' },
  startsAt: Date,
  endsAt: Date,
  status: String,
  finalPrice: Number,
  isPaid: Boolean
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
