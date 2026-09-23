const mongoose = require('mongoose');
const { GENDERS, MATERIALS, PRODUCT_STATUS } = require('../constants');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, trim: true, unique: true, sparse: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    subcategory: { type: String, trim: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    description: { type: String, trim: true },
    material: { type: String, enum: MATERIALS },
    gender: { type: String, enum: GENDERS },
    taxRate: { type: Number, default: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    images: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);