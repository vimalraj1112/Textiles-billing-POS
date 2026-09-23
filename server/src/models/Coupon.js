const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], default: 'PERCENT' },
    discountValue: { type: Number, required: true },
    minimumAmount: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);