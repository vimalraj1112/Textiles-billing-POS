const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    points: { type: Number, required: true },
    type: { type: String, enum: ['EARN', 'REDEEM', 'ADJUST'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);