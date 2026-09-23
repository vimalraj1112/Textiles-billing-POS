const InventoryMovement = require('../models/InventoryMovement');
const ProductVariant = require('../models/ProductVariant');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { MOVEMENT_TYPES, NOTIFICATION_TYPES, ROLES } = require('../constants');

async function adjustStock({ variantId, type, quantity, reason, referenceId, user, allowNegative = false }) {
  const variant = await ProductVariant.findById(variantId);
  if (!variant) throw new ApiError(404, 'Variant not found');

  const previousStock = variant.stock;
  const newStock = Math.round((previousStock + quantity) * 100) / 100;

  if (newStock < 0 && !allowNegative) {
    throw new ApiError(
      400,
      `Insufficient stock for ${variant.sku || 'this item'}. Available: ${previousStock}, requested: ${previousStock - newStock}`
    );
  }

  variant.stock = Math.max(0, newStock);
  await variant.save();

  await InventoryMovement.create({
    variant: variant._id,
    product: variant.product,
    type,
    quantity,
    previousStock,
    newStock: variant.stock,
    referenceId,
    reason,
    user: user && user._id ? user._id : user || null,
  });

  return { variant, previousStock, newStock: variant.stock };
}

async function checkLowStockAndNotify(variantId) {
  const variant = await ProductVariant.findById(variantId).populate('product').populate('size').populate('color');
  if (!variant || !variant.product) return;

  const label = `${variant.product.name}${variant.size ? ` (${variant.size.name})` : ''}${variant.color ? ` / ${variant.color.name}` : ''}`;
  const min = variant.minimumStock || variant.product.minimumStock || 0;
  if (variant.stock === 0) {
    await Notification.updateOne(
      { entityId: variant._id, type: NOTIFICATION_TYPES.OUT_OF_STOCK },
      {
        $set: {
          title: 'Out of stock',
          message: `${label} is out of stock.`,
          entity: 'ProductVariant',
          entityId: variant._id,
          forRoles: [ROLES.ADMIN, ROLES.MANAGER],
          read: false,
        },
        $setOnInsert: { type: NOTIFICATION_TYPES.OUT_OF_STOCK },
      },
      { upsert: true }
    );
  } else if (variant.stock <= min) {
    await Notification.updateOne(
      { entityId: variant._id, type: NOTIFICATION_TYPES.LOW_STOCK },
      {
        $set: {
          title: 'Low stock',
          message: `${label} is low. Remaining: ${variant.stock}`,
          entity: 'ProductVariant',
          entityId: variant._id,
          forRoles: [ROLES.ADMIN, ROLES.MANAGER],
          read: false,
        },
        $setOnInsert: { type: NOTIFICATION_TYPES.LOW_STOCK },
      },
      { upsert: true }
    );
  } else {
    await Notification.deleteMany({
      entityId: variant._id,
      type: { $in: [NOTIFICATION_TYPES.LOW_STOCK, NOTIFICATION_TYPES.OUT_OF_STOCK] },
    });
  }
}

function getStockStatus(stock, minimumStock) {
  if (stock === 0) return 'OUT_OF_STOCK';
  if (stock <= minimumStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}

module.exports = { adjustStock, checkLowStockAndNotify, getStockStatus };