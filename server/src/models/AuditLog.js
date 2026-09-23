const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../constants');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String },
    role: { type: String },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    entity: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);