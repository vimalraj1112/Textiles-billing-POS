const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const purchaseService = require('../services/purchaseService');
const logAudit = require('../services/auditService');

const createPurchase = asyncHandler(async (req, res) => {
  const data = await purchaseService.createPurchase(req.body, req.userId);
  await logAudit({ user: req.user, action: 'CREATE_PURCHASE', entity: 'Purchase', entityId: data._id, description: `Created purchase: ${data.purchaseNumber}`, ip: req.ip });
  return apiSuccess(res, data, 'Purchase created. Inventory updated.', 201);
});

const listPurchases = asyncHandler(async (req, res) => {
  const data = await purchaseService.listPurchases(req.query);
  return apiSuccess(res, data, 'Purchases fetched');
});

const getPurchase = asyncHandler(async (req, res) => {
  const data = await purchaseService.getPurchaseById(req.params.id);
  return apiSuccess(res, data, 'Purchase fetched');
});

const payPurchase = asyncHandler(async (req, res) => {
  const data = await purchaseService.payDue(req.params.id, req.body.amount, req.body.method, req.userId);
  return apiSuccess(res, data, 'Payment recorded');
});

module.exports = { createPurchase, listPurchases, getPurchase, payPurchase };