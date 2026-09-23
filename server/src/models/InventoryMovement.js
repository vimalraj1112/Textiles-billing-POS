const mongoose = require('mongoose');
const { MOVEMENT_TYPES } = require('../constants');

const inventoryMovementSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
      index: true,
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    type: { type: String, enum: Object.values(MOVEMENT_TYPES), required: true, index: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ referenceId: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);