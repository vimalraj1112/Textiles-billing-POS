const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ApiError = require('../utils/ApiError');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { MOVEMENT_TYPES } = require('../constants');
const inventoryService = require('./inventoryService');

async function listProducts(query) {
  const { page, limit, skip } = buildPagination(query);
  const { search, category, brand, size, color, stockStatus, minPrice, maxPrice, status, supplier } = query;

  const cond = {};

  if (search) {
    const variantIds = await ProductVariant.find({
      $or: [
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    const ids = variantIds.map((v) => v._id);
    cond.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { _id: { $in: ids } },
    ];
    if (/^\d+$/.test(search)) {
      cond.$or.push({ _id: { $in: [] } });
    }
  }

  if (category) cond.category = category;
  if (brand) cond.brand = brand;
  if (supplier) cond.supplier = supplier;
  if (status) cond.status = status;
  if (minPrice !== undefined || maxPrice !== undefined) {
    cond.sellingPrice = {};
    if (minPrice !== undefined) cond.sellingPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined) cond.sellingPrice.$lte = Number(maxPrice);
  }

  let productIds = null;
  if (size || color || stockStatus) {
    const vc = {};
    if (size) vc.size = size;
    if (color) vc.color = color;

    const variants = await ProductVariant.find(vc).select('product stock minimumStock');
    const filterByVariant = ({ _id, stock, minimumStock }) =>
      stockStatus === 'LOW_STOCK'
        ? stock > 0 && stock <= (minimumStock || 0)
        : stockStatus === 'OUT_OF_STOCK'
        ? stock === 0
        : stockStatus === 'IN_STOCK'
        ? stock > (minimumStock || 0)
        : true;

    const matching = variants.filter(filterByVariant).map((v) => v.product.toString());
    productIds = productIds ? productIds.filter((p) => matching.includes(p)) : [...new Set(matching)];
  }

  if (productIds !== null) cond._id = { $in: productIds };

  const [total, items] = await Promise.all([
    Product.countDocuments(cond),
    Product.find(cond)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('supplier', 'name')
      .sort(query.sort === 'name' ? { name: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const populated = await Promise.all(
    items.map(async (p) => {
      const variants = await ProductVariant.find({ product: p._id })
        .populate('size', 'name')
        .populate('color', 'name')
        .sort({ createdAt: -1 });
      const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
      const uniq = (arr) => [...new Set(arr).values()];
      return {
        ...p,
        variants,
        totalStock,
        sizes: uniq(variants.map((v) => v.size?.name).filter(Boolean)),
        colors: uniq(variants.map((v) => v.color?.name).filter(Boolean)),
      };
    })
  );

  return paginatedResponse(populated, total, page, limit);
}

async function getProductById(id) {
  const product = await Product.findById(id)
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('supplier', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  const variants = await ProductVariant.find({ product: id })
    .populate('size', 'name')
    .populate('color', 'name');
  return { ...product.toObject(), variants };
}

async function createProduct(payload, userId) {
  const { variants = [], ...productData } = payload;

  const product = await Product.create(productData);

  const created = [];
  for (const v of variants) {
    const variant = await ProductVariant.create({
      product: product._id,
      size: v.size || null,
      color: v.color || null,
      sku: v.sku || null,
      barcode: v.barcode || null,
      purchasePrice: v.purchasePrice || productData.purchasePrice || 0,
      sellingPrice: v.sellingPrice || productData.sellingPrice || 0,
      stock: v.stock || 0,
      minimumStock: v.minimumStock || productData.minimumStock || 0,
      status: 'ACTIVE',
    });
    if (v.stock > 0) {
      await inventoryService.adjustStock({
        variantId: variant._id,
        type: MOVEMENT_TYPES.ADJUSTMENT,
        quantity: v.stock,
        reason: 'Initial stock on product creation',
        user: userId,
      });
    }
    created.push(variant);
  }

  if (variants.length === 0) {
    // Bare product: create a single default variant so billing always has a stock record.
    const variant = await ProductVariant.create({
      product: product._id,
      size: null,
      color: null,
      sku: product.sku || null,
      barcode: null,
      purchasePrice: productData.purchasePrice || 0,
      sellingPrice: productData.sellingPrice || 0,
      stock: 0,
      minimumStock: productData.minimumStock || 0,
      status: 'ACTIVE',
    });
    created.push(variant);
  }

  return getProductById(product._id);
}

async function updateProduct(id, payload, userId) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  const { variants, ...productData } = payload;

  if (variants) {
    await updateVariants(product, variants, userId);
  }

  Object.assign(product, productData);
  await product.save();
  return getProductById(product._id);
}

async function updateVariants(product, variants, userId) {
  const incomingIds = variants.filter((v) => v._id).map((v) => v._id);
  if (incomingIds.length) {
    await ProductVariant.deleteMany({ product: product._id, _id: { $nin: incomingIds } });
  } else {
    await ProductVariant.deleteMany({ product: product._id });
  }

  for (const v of variants) {
    const data = {
      product: product._id,
      size: v.size || null,
      color: v.color || null,
      sku: v.sku || null,
      barcode: v.barcode || null,
      purchasePrice: v.purchasePrice ?? product.purchasePrice ?? 0,
      sellingPrice: v.sellingPrice ?? product.sellingPrice ?? 0,
      minimumStock: v.minimumStock ?? product.minimumStock ?? 0,
      status: v.status || 'ACTIVE',
    };

    if (v._id && v.stock !== undefined) {
      // Preserve existing stock unless explicitly provided
      const existing = await ProductVariant.findById(v._id);
      if (existing) {
        const delta = v.stock - existing.stock;
        if (delta !== 0) {
          await inventoryService.adjustStock({
            variantId: existing._id,
            type: MOVEMENT_TYPES.ADJUSTMENT,
            quantity: delta,
            reason: 'Stock adjusted during product edit',
            user: userId,
          });
        }
        await ProductVariant.findByIdAndUpdate(existing._id, data, { runValidators: true });
        continue;
      }
    }

    data.stock = v.stock || 0;
    const created = await ProductVariant.create(data);
    if (data.stock > 0) {
      await inventoryService.adjustStock({
        variantId: created._id,
        type: MOVEMENT_TYPES.ADJUSTMENT,
        quantity: data.stock,
        reason: 'Initial stock for new variant',
        user: userId,
      });
    }
  }
}

async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');
  const variants = await ProductVariant.find({ product: id });
  const { Sale } = require('../models/Sale');
  const salesCount = await Sale.countDocuments({ 'items.product': id });
  if (salesCount > 0) {
    throw new ApiError(409, 'Cannot delete: product has sales history. Deactivate it instead.');
  }
  await ProductVariant.deleteMany({ product: id });
  await product.deleteOne();
  return product;
}

async function searchForPOS(query) {
  const term = String(query.search || '').trim();

  if (!term) {
    const products = await listProducts({ limit: 20, page: 1 });
    return products;
  }

  const variantMatch = await ProductVariant.find({
    $or: [{ barcode: term }, { sku: { $regex: term, $options: 'i' } }],
  })
    .select('product')
    .populate('product');

  if (variantMatch.length > 0) {
    const productDocs = variantMatch.map((v) => v.product).filter(Boolean);
    const unique = [
      ...new Map(productDocs.map((p) => [p._id.toString(), p])).values(),
    ];
    const populated = await Promise.all(unique.map((p) => getProductById(p._id)));
    return { items: populated, total: populated.length, page: 1, limit: 20, pages: 1 };
  }

  return listProducts({ ...query, search: term, limit: 20 });
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchForPOS,
};