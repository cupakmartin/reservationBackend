const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  periodStart: { 
    type: Date, 
    required: true 
  },
  periodEnd: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

PayoutSchema.index({ workerId: 1, periodStart: 1 });

module.exports = mongoose.model('Payout', PayoutSchema);
