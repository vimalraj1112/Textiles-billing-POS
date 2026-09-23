const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const productService = require('../services/productService');
const logAudit = require('../services/auditService');

const listProducts = asyncHandler(async (req, res) => {
  const data = await productService.listProducts(req.query);
  return apiSuccess(res, data, 'Products fetched');
});

const getProduct = asyncHandler(async (req, res) => {
  const data = await productService.getProductById(req.params.id);
  return apiSuccess(res, data, 'Product fetched');
});

const createProduct = asyncHandler(async (req, res) => {
  const data = await productService.createProduct(req.body, req.userId);
  await logAudit({
    user: req.user,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: data._id,
    description: `Created product: ${data.name}`,
    ip: req.ip,
  });
  return apiSuccess(res, data, 'Product created successfully', 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const data = await productService.updateProduct(req.params.id, req.body, req.userId);
  await logAudit({
    user: req.user,
    action: 'UPDATE_PRODUCT',
    entity: 'Product',
    entityId: data._id,
    description: `Updated product: ${data.name}`,
    ip: req.ip,
  });
  return apiSuccess(res, data, 'Product updated successfully');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const data = await productService.deleteProduct(req.params.id);
  await logAudit({
    user: req.user,
    action: 'DELETE_PRODUCT',
    entity: 'Product',
    entityId: data._id,
    description: `Deleted product: ${data.name}`,
    ip: req.ip,
  });
  return apiSuccess(res, data, 'Product deleted');
});

const searchPOS = asyncHandler(async (req, res) => {
  const data = await productService.searchForPOS(req.query);
  return apiSuccess(res, data, 'Products fetched');
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchPOS,
};