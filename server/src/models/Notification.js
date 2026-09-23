const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true, index: true },
    title: { type: String, required: true },
    message: { type: String },
    entity: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
    forRoles: [{ type: String }],
  },
  { timestamps: true }
);

notificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);