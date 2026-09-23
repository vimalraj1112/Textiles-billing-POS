const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const returnService = require('../services/returnService');
const logAudit = require('../services/auditService');

const createSalesReturn = asyncHandler(async (req, res) => {
  const data = await returnService.createSalesReturn(req.body, req.user);
  await logAudit({ user: req.user, action: 'RETURN_SALE', entity: 'SalesReturn', entityId: data._id, description: `Sales return ${data.returnNumber}`, ip: req.ip });
  return apiSuccess(res, data, 'Return processed. Stock updated.', 201);
});

const createPurchaseReturn = asyncHandler(async (req, res) => {
  const data = await returnService.createPurchaseReturn(req.body, req.user);
  return apiSuccess(res, data, 'Purchase return recorded. Stock updated.', 201);
});

const listSalesReturns = asyncHandler(async (req, res) => {
  const data = await returnService.listSalesReturns(req.query);
  return apiSuccess(res, data, 'Returns fetched');
});

const listPurchaseReturns = asyncHandler(async (req, res) => {
  const data = await returnService.listPurchaseReturns(req.query);
  return apiSuccess(res, data, 'Purchase returns fetched');
});

const validateReturnable = asyncHandler(async (req, res) => {
  const data = await returnService.validateReturnable(req.params.saleId);
  return apiSuccess(res, data, 'Returnable items fetched');
});

module.exports = { createSalesReturn, createPurchaseReturn, listSalesReturns, listPurchaseReturns, validateReturnable };