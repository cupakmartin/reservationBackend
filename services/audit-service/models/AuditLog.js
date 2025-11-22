const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  actorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true,
    index: true
  },
  action: { 
    type: String, 
    required: true,
    index: true
  },
  resourceId: { 
    type: String, 
    required: false 
  },
  details: { 
    type: mongoose.Schema.Types.Mixed, 
    required: false 
  },
  ipAddress: { 
    type: String, 
    required: false 
  }
}, { timestamps: true });

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
