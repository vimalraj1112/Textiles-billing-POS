const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const reportService = require('../services/reportService');

const salesReport = asyncHandler(async (req, res) => {
  const data = await reportService.salesReport(req.query);
  return apiSuccess(res, data, 'Sales report');
});

const productReport = asyncHandler(async (req, res) => {
  const data = await reportService.productReport(req.query);
  return apiSuccess(res, data, 'Product report');
});

const categoryReport = asyncHandler(async (req, res) => {
  const data = await reportService.categoryReport(req.query);
  return apiSuccess(res, data, 'Category report');
});

const paymentReport = asyncHandler(async (req, res) => {
  const data = await reportService.paymentReport(req.query);
  return apiSuccess(res, data, 'Payment report');
});

const profitReport = asyncHandler(async (req, res) => {
  const data = await reportService.profitReport(req.query);
  return apiSuccess(res, data, 'Profit report');
});

const expenseReport = asyncHandler(async (req, res) => {
  const data = await reportService.expenseReport(req.query);
  return apiSuccess(res, data, 'Expense report');
});

const stockValue = asyncHandler(async (req, res) => {
  const data = await reportService.stockValue();
  return apiSuccess(res, data, 'Stock value');
});

module.exports = {
  salesReport,
  productReport,
  categoryReport,
  paymentReport,
  profitReport,
  expenseReport,
  stockValue,
};