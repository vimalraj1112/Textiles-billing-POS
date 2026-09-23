const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const saleService = require('../services/saleService');
const settingsService = require('../services/settingsService');
const logAudit = require('../services/auditService');

const createSale = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  const data = await saleService.completeSale(
    req.body,
    req.user,
    settings.allowNegativeStock
  );
  await logAudit({ user: req.user, action: 'CREATE_SALE', entity: 'Sale', entityId: data._id, description: `Sale completed: ${data.invoiceNumber}`, ip: req.ip });
  return apiSuccess(res, data, 'Sale completed successfully', 201);
});

const reserveHold = asyncHandler(async (req, res) => {
  const held = await saleService.createHeldSale(req.body, req.user);
  await logAudit({ user: req.user, action: 'HOLD_BILL', entity: 'Sale', entityId: held._id, description: `Held bill ${held.invoiceNumber}`, ip: req.ip });
  return apiSuccess(res, held, 'Bill held successfully', 201);
});

const listSales = asyncHandler(async (req, res) => {
  const data = await saleService.listSales(req.query);
  return apiSuccess(res, data, 'Sales fetched');
});

const getSale = asyncHandler(async (req, res) => {
  const data = await saleService.getSaleById(req.params.id);
  return apiSuccess(res, data, 'Sale fetched');
});

const holdSale = asyncHandler(async (req, res) => {
  const held = await saleService.createHeldSale(req.body, req.user);
  return apiSuccess(res, held, 'Bill held', 201);
});

const releaseHold = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  const data = await saleService.releaseHeldSale(req.params.id, req.body, req.user, settings.allowNegativeStock);
  return apiSuccess(res, data, 'Held bill completed');
});

const voidSale = asyncHandler(async (req, res) => {
  const data = await saleService.voidSale(req.params.id, req.user);
  await logAudit({ user: req.user, action: 'CANCEL_SALE', entity: 'Sale', entityId: data._id, description: `Voided sale: ${data.invoiceNumber}`, ip: req.ip });
  return apiSuccess(res, data, 'Sale voided and stock restored');
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const result = await saleService.validateCoupon(code, subtotal);
  return apiSuccess(res, result, 'Coupon valid');
});

module.exports = { createSale, listSales, getSale, holdSale, releaseHold, voidSale, validateCoupon, reserveHold };