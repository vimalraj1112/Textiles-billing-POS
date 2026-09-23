const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES, PAYMENT_METHOD_LIST } = require('../constants');

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_LIST },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);