const mongoose = require('mongoose');
const { Purchase } = require('../models/Purchase');
const ProductVariant = require('../models/ProductVariant');
const ApiError = require('../utils/ApiError');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { nextPurchaseNumber } = require('../utils/counters');
const { MOVEMENT_TYPES, PAYMENT_STATUS } = require('../constants');
const inventoryService = require('./inventoryService');

const round = (n) => Math.round(n);

async function createPurchase(payload, userId) {
  const { supplier, items, discount = 0, paidAmount = 0, paymentMethod, purchaseDate, notes } = payload;

  const seen = new Map();
  let subtotal = 0;

  const normalized = [];
  for (const item of items) {
    const variant = await ProductVariant.findById(item.variant).populate('product');
    if (!variant) throw new ApiError(404, `Variant not found: ${item.variant}`);
    if (!variant.product) throw new ApiError(400, 'Variant has no linked product');

    const unitPrice = Math.round(Number(item.unitPrice) * 100);
    const qty = Math.round(Number(item.quantity));
    if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1');

    const key = variant._id.toString();
    if (seen.has(key)) throw new ApiError(409, `Duplicate item: ${variant.sku || variant._id}`);

    const tax = 0;
    const itemSubtotal = unitPrice * qty;
    subtotal += itemSubtotal;

    seen.set(key, true);
    normalized.push({
      product: variant.product._id,
      variant: variant._id,
      name: variant.product.name,
      sku: variant.sku || variant.product.sku || '',
      size: variant.size ? String(variant.size) : '',
      color: variant.color ? String(variant.color) : '',
      quantity: qty,
      unitPrice,
      tax,
      subtotal: itemSubtotal,
    });
  }

  const total = subtotal - discount * 100;
  if (total < 0) throw new ApiError(400, 'Total cannot be negative');
  const paid = Math.min(Math.round(Number(paidAmount) * 100), total);
  const due = total - paid;

  const purchaseNumber = await nextPurchaseNumber();

  const purchase = await Purchase.create({
    purchaseNumber,
    supplier,
    items: normalized,
    subtotal,
    discount: discount * 100,
    tax: 0,
    total,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus:
      due <= 0 ? PAYMENT_STATUS.PAID : paid > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.PENDING,
    paymentMethod,
    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    createdBy: userId,
    notes,
  });

  try {
    for (const item of normalized) {
      await inventoryService.adjustStock({
        variantId: item.variant,
        type: MOVEMENT_TYPES.PURCHASE,
        quantity: item.quantity,
        reason: `Purchase ${purchase.purchaseNumber}`,
        referenceId: purchase._id,
        user: userId,
      });
      const updated = await ProductVariant.findById(item.variant);
      if (updated) await inventoryService.checkLowStockAndNotify(updated._id);
    }
  } catch (error) {
    await Purchase.deleteOne({ _id: purchase._id });
    throw error;
  }

  return getPurchaseById(purchase._id);
}

async function listPurchases(query) {
  const { page, limit, skip } = buildPagination(query);
  const { search, supplier, paymentStatus, from, to } = query;
  const cond = {};
  if (supplier) cond.supplier = supplier;
  if (paymentStatus) cond.paymentStatus = paymentStatus;
  if (from || to) {
    cond.purchaseDate = {};
    if (from) cond.purchaseDate.$gte = new Date(from);
    if (to) cond.purchaseDate.$lte = new Date(to);
  }
  if (search) cond.$or = [{ purchaseNumber: { $regex: search, $options: 'i' } }];

  const [total, items] = await Promise.all([
    Purchase.countDocuments(cond),
    Purchase.find(cond)
      .populate('supplier', 'name companyName phone')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function getPurchaseById(id) {
  const purchase = await Purchase.findById(id).populate('supplier', 'name companyName phone gstNumber');
  if (!purchase) throw new ApiError(404, 'Purchase not found');
  return purchase;
}

async function payDue(purchaseId, amount, method, userId) {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw new ApiError(404, 'Purchase not found');

  const newPaid = purchase.paidAmount + Math.round(Number(amount) * 100);
  const capped = Math.min(newPaid, purchase.total);
  purchase.paidAmount = capped;
  purchase.dueAmount = purchase.total - capped;
  purchase.paymentStatus =
    purchase.dueAmount <= 0
      ? PAYMENT_STATUS.PAID
      : capped > 0
      ? PAYMENT_STATUS.PARTIAL
      : PAYMENT_STATUS.PENDING;
  if (method) purchase.paymentMethod = method;
  await purchase.save();
  return purchase;
}

module.exports = { createPurchase, listPurchases, getPurchaseById, payDue };