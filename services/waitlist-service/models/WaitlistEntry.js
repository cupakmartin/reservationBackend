const mongoose = require('mongoose');

const WaitlistEntrySchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: false 
  },
  procedureId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Procedure', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

WaitlistEntrySchema.index({ date: 1, clientId: 1, workerId: 1 });

module.exports = mongoose.model('WaitlistEntry', WaitlistEntrySchema);
