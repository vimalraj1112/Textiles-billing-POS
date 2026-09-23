const mongoose = require('mongoose');
const { SalesReturn, PurchaseReturn } = require('../models/Return');
const { Sale } = require('../models/Sale');
const { Purchase } = require('../models/Purchase');
const ApiError = require('../utils/ApiError');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { MOVEMENT_TYPES, RETURN_ACTION, PAYMENT_METHODS, NOTIFICATION_TYPES, ROLES } = require('../constants');
const inventoryService = require('./inventoryService');
const settingsService = require('./settingsService');
const Notification = require('../models/Notification');

async function createSalesReturn(payload, user) {
  const { sale: saleId, items, reason, action = RETURN_ACTION.REFUND, paymentMethod, note } = payload;

  const sale = await Sale.findById(saleId).populate('customer');
  if (!sale) throw new ApiError(404, 'Sale not found');
  if (sale.status !== 'COMPLETED') throw new ApiError(400, 'Only completed sales can be returned');

  const returnedSoFar = await SalesReturn.aggregate([
    { $match: { sale: sale._id } },
    { $unwind: '$items' },
    {
      $group: { _id: '$items.variant', total: { $sum: '$items.quantity' } },
    },
  ]);
  const returnedMap = new Map(returnedSoFar.map((r) => [r._id.toString(), r.total]));

  let refundAmount = 0;
  const normalized = [];

  for (const ri of items) {
    const saleItem = sale.items.find(
      (si) => si._id.toString() === ri.saleItem || si.variant.toString() === ri.variant
    );
    if (!saleItem) throw new ApiError(400, 'Item does not belong to this invoice');

    const alreadyReturned = returnedMap.get(ri.variant) || 0;
    const maxReturnable = saleItem.quantity - alreadyReturned;
    const qty = Math.round(ri.quantity);

    if (qty < 1) throw new ApiError(400, 'Return quantity must be at least 1');
    if (qty > maxReturnable) {
      throw new ApiError(
        400,
        `Cannot return more than sold for ${saleItem.name}. Sold: ${saleItem.quantity}, already returned: ${alreadyReturned}`
      );
    }

    const perUnit = saleItem.subtotal / saleItem.quantity;
    const amount = Math.round(perUnit * qty);
    refundAmount += amount;

    normalized.push({
      saleItem: saleItem._id,
      product: saleItem.product,
      variant: saleItem.variant,
      name: saleItem.name,
      quantity: qty,
      unitPrice: Math.round(perUnit),
      refundAmount: amount,
    });
  }

  const returnNumber = await (async () => {
    const c = await SalesReturn.countDocuments();
    return `RET-${String(c + 1).padStart(6, '0')}`;
  })();

  const sret = await SalesReturn.create({
    returnNumber,
    sale: sale._id,
    customer: sale.customer?._id || sale.customer || null,
    items: normalized,
    reason,
    action,
    refundAmount,
    paymentMethod: paymentMethod || (action === RETURN_ACTION.REFUND ? PAYMENT_METHODS.CASH : null),
    note,
    createdBy: user._id,
  });

  try {
    for (const ri of normalized) {
      await inventoryService.adjustStock({
        variantId: ri.variant,
        type: MOVEMENT_TYPES.SALE_RETURN,
        quantity: ri.quantity,
        reason: `Sales return ${returnNumber}`,
        referenceId: sret._id,
        user: user._id,
      });
      await inventoryService.checkLowStockAndNotify(ri.variant);
    }
  } catch (error) {
    await SalesReturn.deleteOne({ _id: sret._id });
    throw error;
  }

  if (sale.customer) {
    const customer = sale.customer;
    customer.totalPurchases = Math.max(0, customer.totalPurchases - refundAmount);
    await customer.save();
  }

  if (refundAmount >= sale.grandTotal * 0.5) {
    await Notification.create({
      type: NOTIFICATION_TYPES.LARGE_RETURN,
      title: 'Large return recorded',
      message: `Return ${returnNumber} worth ₹${(refundAmount / 100).toFixed(2)} on invoice ${sale.invoiceNumber}`,
      entity: 'SalesReturn',
      entityId: sret._id,
      forRoles: [ROLES.ADMIN, ROLES.MANAGER],
    });
  }

  return getSalesReturnById(sret._id);
}

async function createPurchaseReturn(payload, user) {
  const { purchase: purchaseId, items, reason, note } = payload;
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw new ApiError(404, 'Purchase not found');

  const normalized = [];
  let returnAmount = 0;

  for (const ri of items) {
    const pi = purchase.items.find(
      (it) => it._id.toString() === ri.purchaseItem || it.variant.toString() === ri.variant
    );
    if (!pi) throw new ApiError(400, 'Item does not belong to this purchase');
    const qty = Math.round(ri.quantity);
    if (qty < 1) throw new ApiError(400, 'Return quantity must be at least 1');
    if (qty > pi.quantity) throw new ApiError(400, `Cannot return more than purchased for ${pi.name}`);
    const amount = Math.round((pi.unitPrice / pi.quantity) * qty * 1);

    const perUnit = pi.unitPrice / pi.quantity;
    const amt = Math.round(perUnit * qty);
    returnAmount += amt;

    normalized.push({
      purchaseItem: pi._id,
      product: pi.product,
      variant: pi.variant,
      name: pi.name,
      quantity: qty,
      unitPrice: Math.round(perUnit),
      returnAmount: amt,
    });
  }

  const c = await PurchaseReturn.countDocuments();
  const returnNumber = `PRET-${String(c + 1).padStart(6, '0')}`;

  const pret = await PurchaseReturn.create({
    returnNumber,
    purchase: purchase._id,
    supplier: purchase.supplier,
    items: normalized,
    reason,
    returnAmount,
    note,
    createdBy: user._id,
  });

  try {
    for (const ri of normalized) {
      await inventoryService.adjustStock({
        variantId: ri.variant,
        type: MOVEMENT_TYPES.PURCHASE_RETURN,
        quantity: -ri.quantity,
        reason: `Purchase return ${returnNumber}`,
        referenceId: pret._id,
        user: user._id,
      });
      await inventoryService.checkLowStockAndNotify(ri.variant);
    }
  } catch (error) {
    await PurchaseReturn.deleteOne({ _id: pret._id });
    throw error;
  }

  return pret;
}

async function getSalesReturnById(id) {
  const ret = await SalesReturn.findById(id)
    .populate('sale', 'invoiceNumber')
    .populate('customer', 'name phone')
    .populate('createdBy', 'name');
  if (!ret) throw new ApiError(404, 'Return not found');
  return ret;
}

async function listSalesReturns(query) {
  const { page, limit, skip } = buildPagination(query);
  const cond = {};
  if (query.search) cond.returnNumber = { $regex: query.search, $options: 'i' };
  const [total, items] = await Promise.all([
    SalesReturn.countDocuments(cond),
    SalesReturn.find(cond)
      .populate('sale', 'invoiceNumber')
      .populate('customer', 'name phone')
      .sort({ returnedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function listPurchaseReturns(query) {
  const { page, limit, skip } = buildPagination(query);
  const cond = {};
  if (query.search) cond.returnNumber = { $regex: query.search, $options: 'i' };
  const [total, items] = await Promise.all([
    PurchaseReturn.countDocuments(cond),
    PurchaseReturn.find(cond)
      .populate('purchase', 'purchaseNumber')
      .populate('supplier', 'name')
      .sort({ returnedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function validateReturnable(saleId) {
  const sale = await Sale.findById(saleId);
  if (!sale) throw new ApiError(404, 'Sale not found');
  const returnedSoFar = await SalesReturn.aggregate([
    { $match: { sale: sale._id } },
    { $unwind: '$items' },
    { $group: { _id: '$items.variant', total: { $sum: '$items.quantity' } } },
  ]);
  const returnedMap = new Map(returnedSoFar.map((r) => [r._id.toString(), r.total]));
  const items = sale.items.map((si) => ({
    ...si.toObject(),
    returnedQty: returnedMap.get(si.variant.toString()) || 0,
    returnableQty: si.quantity - (returnedMap.get(si.variant.toString()) || 0),
  }));
  return { ...sale.toObject(), items };
}

module.exports = {
  createSalesReturn,
  createPurchaseReturn,
  listSalesReturns,
  listPurchaseReturns,
  validateReturnable,
};