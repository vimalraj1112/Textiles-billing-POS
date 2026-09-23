const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess, apiError } = require('../utils/respond');
const ProductVariant = require('../models/ProductVariant');
const InventoryMovement = require('../models/InventoryMovement');
const inventoryService = require('../services/inventoryService');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { MOVEMENT_TYPES } = require('../constants');
const logAudit = require('../services/auditService');

const listInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { search, category, brand, size, color, stockStatus } = req.query;

  const cond = {};

  if (size) cond.size = size;
  if (color) cond.color = color;

  if (!cond.product && (search || category || brand)) {
    const Product = require('../models/Product');
    const pc = {};
    if (search) {
      pc.$or = [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }];
    }
    if (category) pc.category = category;
    if (brand) pc.brand = brand;
    const productIds = await Product.find(pc).select('_id');
    cond.product = { $in: productIds.map((p) => p._id) };
  }

  let items = await ProductVariant.find(cond)
    .populate('product', 'name sku category brand minimumStock status')
    .populate('size', 'name')
    .populate('color', 'name');

  items = items.map((v) => {
    const stock = v.stock || 0;
    const min = v.minimumStock || v.product?.minimumStock || 0;
    return {
      ...v.toObject(),
      stockStatus: inventoryService.getStockStatus(stock, min),
    };
  });

  if (stockStatus) {
    items = items.filter((i) => i.stockStatus === stockStatus);
  }

  const total = items.length;
  const paged = items.slice(skip, skip + limit);
  return apiSuccess(res, paginatedResponse(paged, total, page, limit), 'Inventory fetched');
});

const listMovements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query);
  const { type, variant, from, to, product } = req.query;

  const cond = {};
  if (type) cond.type = type;
  if (variant) cond.variant = variant;
  if (product) cond.product = product;
  if (from || to) {
    cond.createdAt = {};
    if (from) cond.createdAt.$gte = new Date(from);
    if (to) cond.createdAt.$lte = new Date(to);
  }

  const [total, items] = await Promise.all([
    InventoryMovement.countDocuments(cond),
    InventoryMovement.find(cond)
      .populate('variant', 'sku')
      .populate('product', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return apiSuccess(res, paginatedResponse(items, total, page, limit), 'Movements fetched');
});

const adjustStock = asyncHandler(async (req, res) => {
  const { variantId, quantity, reason, type = MOVEMENT_TYPES.ADJUSTMENT } = req.body;
  if (!variantId) return apiError(res, 400, 'variantId is required');
  const data = await inventoryService.adjustStock({
    variantId,
    type,
    quantity: Number(quantity),
    reason,
    user: req.user,
    allowNegative: req.body.allowNegative === true,
  });
  await inventoryService.checkLowStockAndNotify(variantId);
  await logAudit({
    user: req.user,
    action: 'UPDATE_STOCK',
    entity: 'ProductVariant',
    entityId: variantId,
    description: `Stock adjusted by ${quantity} (${type})`,
    ip: req.ip,
  });
  return apiSuccess(res, data, 'Stock adjusted');
});

const lowStock = asyncHandler(async (req, res) => {
  const variants = await ProductVariant.find({ $expr: { $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$minimumStock', 0] }] } })
    .populate('product', 'name sku')
    .populate('size', 'name')
    .populate('color', 'name')
    .limit(50)
    .sort({ stock: 1 });
  return apiSuccess(res, variants, 'Low stock variants fetched');
});

module.exports = { listInventory, listMovements, adjustStock, lowStock };