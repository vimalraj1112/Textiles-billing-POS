const mongoose = require('mongoose');
const { RETURN_REASONS, RETURN_ACTION } = require('../constants');

const salesReturnItemSchema = new mongoose.Schema(
  {
    saleItem: { type: mongoose.Schema.Types.ObjectId },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
  },
  { _id: true }
);

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: [salesReturnItemSchema],
    reason: { type: String, enum: RETURN_REASONS, required: true },
    action: { type: String, enum: Object.values(RETURN_ACTION), default: RETURN_ACTION.REFUND },
    refundAmount: { type: Number, required: true },
    paymentMethod: { type: String },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const purchaseReturnItemSchema = new mongoose.Schema(
  {
    purchaseItem: { type: mongoose.Schema.Types.ObjectId },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    returnAmount: { type: Number, required: true },
  },
  { _id: true }
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
    items: [purchaseReturnItemSchema],
    reason: { type: String, required: true },
    returnAmount: { type: Number, required: true },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = {
  SalesReturn: mongoose.model('SalesReturn', salesReturnSchema),
  SalesReturnItem: mongoose.model('SalesReturnItem', salesReturnItemSchema),
  PurchaseReturn: mongoose.model('PurchaseReturn', purchaseReturnSchema),
  PurchaseReturnItem: mongoose.model('PurchaseReturnItem', purchaseReturnItemSchema),
};