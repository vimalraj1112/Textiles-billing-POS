const { Sale, Payment } = require('../models/Sale');
const ProductVariant = require('../models/ProductVariant');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { nextInvoiceNumber } = require('../utils/counters');
const { MOVEMENT_TYPES, PAYMENT_STATUS, PAYMENT_METHOD_LIST, ROLES, NOTIFICATION_TYPES } = require('../constants');
const inventoryService = require('./inventoryService');
const settingsService = require('./settingsService');

const round = (n) => Math.round(n);

function computeLineTotals(quantity, unitPrice, itemDiscountP, taxRatePct) {
  const qty = Math.max(1, Math.round(quantity));
  const base = unitPrice * qty;
  const discount = Math.min(itemDiscountP, base);
  const afterDiscount = base - discount;
  const tax = round(afterDiscount * (taxRatePct / 100));
  return {
    qty,
    base,
    discount,
    tax,
    subtotal: afterDiscount + tax,
  };
}

async function loadCartItems(items) {
  const lines = [];
  for (const item of items) {
    const variant = await ProductVariant.findById(item.variant).populate('product').populate('size').populate('color');
    if (!variant) throw new ApiError(404, `Variant not found: ${item.variant}`);
    if (variant.status !== 'ACTIVE') throw new ApiError(400, `Variant is inactive: ${variant.sku || variant._id}`);

    const unitPrice = Math.round(Number(item.unitPrice ?? variant.sellingPrice) * 100);
    const qty = Math.max(1, Math.round(item.quantity));

    if (variant.stock < qty - Math.max(0, parseInt(item.alreadyStocked, 10) || 0)) {
      throw new ApiError(
        400,
        `Insufficient stock for ${variant.product.name}${variant.size ? ` (${variant.size.name})` : ''}${variant.color ? ` (${variant.color.name})` : ''}. Available: ${variant.stock}`
      );
    }

    const itemDiscount = Math.round(Number(item.discount || 0) * 100);
    const taxRate = Number(variant.product.taxRate || 0);
    const totals = computeLineTotals(qty, unitPrice, itemDiscount, taxRate);

    lines.push({
      variant,
      product: variant.product,
      quantity: qty,
      unitPrice,
      base: totals.base,
      discount: totals.discount,
      tax: totals.tax,
      subtotal: totals.subtotal,
      purchasePrice: Math.round(Number(variant.purchasePrice || variant.product.purchasePrice || 0) * 100),
    });
  }
  return lines;
}

function applyBillDiscount(billSubtotal, type, value) {
  const val = Math.max(0, Number(value || 0));
  if (type === 'PERCENT') {
    const capped = Math.min(val, 100);
    return round(billSubtotal * (capped / 100));
  }
  return round(Math.min(val * 100, billSubtotal));
}

async function validateCoupon(code, subtotalPaise, usedBy = []) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
  if (!coupon) throw new ApiError(400, 'Invalid or inactive coupon');
  const now = new Date();
  if (coupon.startDate && now < new Date(coupon.startDate)) throw new ApiError(400, 'Coupon not started yet');
  if (coupon.endDate && now > new Date(coupon.endDate)) throw new ApiError(400, 'Coupon expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
  if (subtotalPaise < coupon.minimumAmount * 100) throw new ApiError(400, `Minimum order amount for this coupon is ₹${coupon.minimumAmount}`);

  let discount;
  if (coupon.discountType === 'PERCENT') {
    const capped = Math.min(coupon.discountValue, 100);
    discount = round(subtotalPaise * (capped / 100));
  } else {
    discount = coupon.discountValue * 100;
  }
  if (coupon.maximumDiscount > 0) discount = Math.min(discount, coupon.maximumDiscount * 100);
  discount = Math.min(discount, subtotalPaise);

  if (usedBy.length) {
    const usedAlready = await Sale.countDocuments({ couponCode: code.toUpperCase().trim(), _id: { $in: usedBy } });
    if (usedAlready >= coupon.usageLimit && coupon.usageLimit > 0) throw new ApiError(400, 'Coupon usage limit reached');
  }
  return { coupon, discount };
}

async function settleAccountChange(customerId, deltaPaise, userId, referenceId, note) {
  const customer = await Customer.findById(customerId);
  if (!customer) return;
  customer.totalPurchases = Math.max(0, Math.round(customer.totalPurchases + deltaPaise));
  customer.outstandingAmount = Math.max(0, Math.round(customer.outstandingAmount + deltaPaise));
  await customer.save();
}

async function completeSale(payload, user, allowNegativeStock) {
  const {
    customer,
    items,
    billDiscountType = 'FIXED',
    billDiscountValue = 0,
    couponCode,
    payments = [],
    notes,
    redeemPoints = 0,
    status,
    dueDate,
  } = payload;

  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Cart is empty');
  if (status === 'HELD') {
    return createHeldSale(payload, user);
  }

  const lines = await loadCartItems(items);

  const itemsSubtotal = lines.reduce((s, l) => s + l.base, 0);
  const itemsDiscount = lines.reduce((s, l) => s + l.discount, 0);
  const itemsTax = lines.reduce((s, l) => s + l.tax, 0);
  const billDiscount = applyBillDiscount(itemsSubtotal, billDiscountType, billDiscountValue);

  let couponDiscount = 0;
  if (couponCode) {
    const c = await validateCoupon(couponCode, itemsSubtotal - billDiscount);
    couponDiscount = c.discount;
  }

  let grandTotal = itemsSubtotal - billDiscount - couponDiscount;
  if (grandTotal < 0) grandTotal = 0;

  const settings = await settingsService.getSettings();

  let loyaltyEarned = 0;
  let pointRedeemPaise = 0;
  let loyaltyCustomer = null;

  if (customer) {
    loyaltyCustomer = await Customer.findById(customer);
    if (!loyaltyCustomer) throw new ApiError(404, 'Customer not found');

    if (redeemPoints > 0) {
      const rate = settings.loyaltyRupeePerPoint || 0;
      if (loyaltyCustomer.loyaltyPoints < redeemPoints) throw new ApiError(400, 'Insufficient loyalty points');
      if (redeemPoints < (settings.loyaltyMinRedemption || 0)) {
        throw new ApiError(400, `Minimum redemption is ${settings.loyaltyMinRedemption} points`);
      }
      pointRedeemPaise = Math.min(round(redeemPoints * rate * 100), grandTotal);
      grandTotal -= pointRedeemPaise;
    }

    const perRupee = settings.loyaltyPointsPerRupee || 0;
    if (perRupee > 0) loyaltyEarned = Math.floor(grandTotal / (perRupee * 100));
  }

  let receivedPaise = 0;
  let requestedCreditPaise = 0;
  for (const p of payments) {
    const amount = Math.round(Number(p.amount) * 100);
    if (amount <= 0) continue;
    if (p.method === 'Credit') requestedCreditPaise += amount;
    else receivedPaise += amount;
  }

  receivedPaise = Math.min(receivedPaise, grandTotal);
  const due = grandTotal - receivedPaise;
  let isCredit = requestedCreditPaise > 0 || due > 0;
  let creditRecordedPaise = 0;

  if (isCredit) {
    if (!customer) throw new ApiError(400, 'A customer is required for credit / partial payment');
    if (user.role === ROLES.CASHIER) {
      throw new ApiError(403, 'Only manager or admin can process credit / partial payments');
    }
    creditRecordedPaise = Math.min(requestedCreditPaise > 0 ? requestedCreditPaise : due, due);
  }

  const invoiceNumber = await nextInvoiceNumber(new Date().getFullYear());

  const sale = await Sale.create({
    invoiceNumber,
    customer: customer || null,
    items: lines.map((l) => ({
      product: l.product._id,
      variant: l.variant._id,
      name: l.product.name,
      sku: l.variant.sku || l.product.sku || '',
      size: l.variant.size?.name || '',
      color: l.variant.color?.name || '',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      tax: l.tax,
      subtotal: l.subtotal,
      purchasePrice: l.purchasePrice,
    })),
    subtotal: itemsSubtotal,
    discount: itemsDiscount + billDiscount + couponDiscount,
    tax: itemsTax,
    grandTotal,
    paymentStatus: due <= 0 ? PAYMENT_STATUS.PAID : receivedPaise > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.PENDING,
    cashier: user._id,
    saleDate: new Date(),
    billDiscountType,
    billDiscountValue: billDiscountValue * 100,
    couponCode: couponCode ? couponCode.toUpperCase().trim() : null,
    amountPaid: receivedPaise,
    amountDue: due,
    dueDate: dueDate ? new Date(dueDate) : null,
    loyaltyPointsEarned: loyaltyEarned,
    isCredit,
    status: 'COMPLETED',
    notes,
  });

  const paymentDocs = [];
  if (receivedPaise > 0) {
    let remaining = receivedPaise;
    for (const p of payments) {
      if (remaining <= 0) break;
      if (p.method === 'Credit') continue;
      const amount = Math.min(Math.round(Number(p.amount) * 100), remaining);
      if (amount <= 0) continue;
      const doc = await Payment.create({
        sale: sale._id,
        customer: customer || null,
        amount,
        method: p.method,
        reference: p.reference || null,
        user: user._id,
        note: null,
      });
      paymentDocs.push(doc._id);
      remaining -= amount;
    }
  }
  if (creditRecordedPaise > 0) {
    const doc = await Payment.create({
      sale: sale._id,
      customer: customer || null,
      amount: creditRecordedPaise,
      method: 'Credit',
      reference: null,
      user: user._id,
      note: 'Credit sale',
    });
    paymentDocs.push(doc._id);
  }

  sale.payments = paymentDocs;
  await sale.save();

  try {
    for (const l of lines) {
      await inventoryService.adjustStock({
        variantId: l.variant._id,
        type: MOVEMENT_TYPES.SALE,
        quantity: -l.quantity,
        reason: `Sale ${invoiceNumber}`,
        referenceId: sale._id,
        user: user._id,
        allowNegative: allowNegativeStock,
      });
      await inventoryService.checkLowStockAndNotify(l.variant._id);
    }
  } catch (error) {
    await Sale.deleteOne({ _id: sale._id });
    await Payment.deleteMany({ sale: sale._id });
    throw error;
  }

  if (customer) {
    await settleAccountChange(customer, grandTotal, user._id, sale._id, 'Sale');

    if (loyaltyEarned > 0) {
      loyaltyCustomer.loyaltyPoints += loyaltyEarned;
      await loyaltyCustomer.save();
      await LoyaltyTransaction.create({
        customer,
        points: loyaltyEarned,
        type: 'EARN',
        referenceId: sale._id,
        note: `Points earned on ${invoiceNumber}`,
        createdBy: user._id,
      });
    }
    if (pointRedeemPaise > 0) {
      await LoyaltyTransaction.create({
        customer,
        points: -redeemPoints,
        type: 'REDEEM',
        referenceId: sale._id,
        note: `Points redeemed on ${invoiceNumber}`,
        createdBy: user._id,
      });
    }
  }

  if (due > 0) {
    await Notification.create({
      type: NOTIFICATION_TYPES.PENDING_PAYMENT,
      title: 'Pending payment',
      message: `₹${(due / 100).toFixed(2)} pending on invoice ${invoiceNumber}`,
      entity: 'Sale',
      entityId: sale._id,
      forRoles: [ROLES.ADMIN, ROLES.MANAGER],
    });
  }

  if (couponCode) {
    await Coupon.updateOne(
      { code: couponCode.toUpperCase().trim() },
      { $inc: { usedCount: 1 } }
    );
  }

  return getSaleById(sale._id);
}

async function createHeldSale(payload, user) {
  const { items, customer, notes } = payload;
  const lines = await loadCartItems(items);
  const itemsSubtotal = lines.reduce((s, l) => s + l.base, 0);
  const itemsDiscount = lines.reduce((s, l) => s + l.discount, 0);
  const itemsTax = lines.reduce((s, l) => s + l.tax, 0);

  const held = await Sale.create({
    invoiceNumber: await nextInvoiceNumber(new Date().getFullYear()),
    customer: customer || null,
    items: lines.map((l) => ({
      product: l.product._id,
      variant: l.variant._id,
      name: l.product.name,
      sku: l.variant.sku || l.product.sku || '',
      size: l.variant.size?.name || '',
      color: l.variant.color?.name || '',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      tax: l.tax,
      subtotal: l.subtotal,
      purchasePrice: l.purchasePrice,
    })),
    subtotal: itemsSubtotal,
    discount: itemsDiscount,
    tax: itemsTax,
    grandTotal: itemsSubtotal - itemsDiscount + itemsTax,
    paymentStatus: PAYMENT_STATUS.PENDING,
    cashier: user._id,
    status: 'HELD',
    notes,
  });

  return held;
}

async function releaseHeldSale(saleId, payload, user, allowNegativeStock) {
  const held = await Sale.findById(saleId);
  if (!held || held.status !== 'HELD') throw new ApiError(404, 'Held bill not found');

  const merged = {
    items: payload.items && payload.items.length ? payload.items : held.items.map((i) => ({
      variant: i.variant,
      quantity: i.quantity,
      unitPrice: i.unitPrice / 100,
    })),
    customer: payload.customer || held.customer,
    billDiscountType: payload.billDiscountType,
    billDiscountValue: payload.billDiscountValue,
    couponCode: payload.couponCode,
    payments: payload.payments,
    notes: payload.notes || held.notes,
    redeemPoints: payload.redeemPoints,
    status: 'COMPLETED',
  };

  const sale = await completeSale(merged, user, allowNegativeStock);
  await Sale.deleteOne({ _id: saleId });
  return sale;
}

async function voidSale(saleId, user) {
  const sale = await Sale.findById(saleId);
  if (!sale) throw new ApiError(404, 'Sale not found');
  if (sale.status !== 'COMPLETED') throw new ApiError(400, 'Only completed sales can be voided');

  for (const item of sale.items) {
    await inventoryService.adjustStock({
      variantId: item.variant,
      type: MOVEMENT_TYPES.ADJUSTMENT,
      quantity: item.quantity,
      reason: `Void ${sale.invoiceNumber} - restock`,
      referenceId: sale._id,
      user: user._id,
    });
    await inventoryService.checkLowStockAndNotify(item.variant);
  }

  sale.status = 'VOID';
  await sale.save();

  if (sale.customer) {
    await settleAccountChange(sale.customer, -sale.grandTotal, user._id, sale._id, 'Void');
    if (sale.loyaltyPointsEarned > 0) {
      await Customer.updateOne({ _id: sale.customer }, { $inc: { loyaltyPoints: -sale.loyaltyPointsEarned } });
    }
  }

  return sale;
}

async function listSales(query) {
  const { page, limit, skip } = buildPagination(query);
  const { search, customer, cashier, paymentMethod, status, from, to } = query;

  const cond = {};
  if (search) cond.invoiceNumber = { $regex: search, $options: 'i' };
  if (customer) cond.customer = customer;
  if (cashier) cond.cashier = cashier;
  if (status) cond.status = status;
  if (from || to) {
    cond.saleDate = {};
    if (from) cond.saleDate.$gte = new Date(from);
    if (to) cond.saleDate.$lte = new Date(to);
  }

  let saleIds = null;
  if (paymentMethod) {
    const p = await Payment.find({ method: paymentMethod }).select('sale');
    saleIds = p.map((x) => x.sale).filter(Boolean);
    if (saleIds.length) cond._id = { $in: saleIds };
    else return paginatedResponse([], 0, page, limit);
  }

  const [total, items] = await Promise.all([
    Sale.countDocuments(cond),
    Sale.find(cond)
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .sort({ saleDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function getSaleById(id) {
  const sale = await Sale.findById(id)
    .populate('customer', 'name phone email address')
    .populate('cashier', 'name');
  if (!sale) throw new ApiError(404, 'Sale not found');

  const [payments, returns, location] = await Promise.all([
    Payment.find({ sale: sale._id }),
    require('../models/Return').SalesReturn.find({ sale: sale._id }),
    Promise.resolve({}),
  ]);

  return { ...sale.toObject(), payments, returns };
}

module.exports = {
  completeSale,
  createHeldSale,
  releaseHeldSale,
  voidSale,
  listSales,
  getSaleById,
  validateCoupon,
};