const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../constants');

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String, required: true },
    sku: { type: String },
    size: { type: String },
    color: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    purchasePrice: { type: Number, default: 0 },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    reference: { type: String },
    note: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
      index: true,
    },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    branch: { type: String },
    saleDate: { type: Date, default: Date.now, index: true },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], default: 'FIXED' },
    discountValue: { type: Number, default: 0 },
    couponCode: { type: String },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    dueDate: { type: Date },
    loyaltyPointsEarned: { type: Number, default: 0 },
    isCredit: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['COMPLETED', 'VOID', 'HELD'],
      default: 'COMPLETED',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

saleSchema.index({ saleDate: 1, status: 1 });
saleSchema.index({ 'items.product': 1 });

module.exports = {
  Sale: mongoose.model('Sale', saleSchema),
  Payment: mongoose.model('Payment', paymentSchema),
};