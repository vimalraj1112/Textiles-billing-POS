const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', index: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: 'Color', index: true },
    sku: { type: String, trim: true, unique: true, sparse: true, index: true },
    barcode: { type: String, trim: true, unique: true, sparse: true, index: true },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

productVariantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);