const mongoose = require('mongoose');

const CommissionRateSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true,
    unique: true
  },
  rate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1,
    default: 0.5
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('CommissionRate', CommissionRateSchema);
