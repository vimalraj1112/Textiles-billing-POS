const { Sale, Payment } = require('../models/Sale');
const { SalesReturn } = require('../models/Return');
const Expense = require('../models/Expense');
const { Purchase } = require('../models/Purchase');
const ProductVariant = require('../models/ProductVariant');
const ApiError = require('../utils/ApiError');

function dateRange(from, to) {
  const f = from ? new Date(from) : new Date('1970-01-01');
  const t = to ? new Date(to) : new Date();
  const end = new Date(t);
  end.setHours(23, 59, 59, 999);
  return { $gte: f, $lte: end };
}

async function salesReport({ from, to, cashier, customer }) {
  const cond = { saleDate: dateRange(from, to), status: 'COMPLETED' };
  if (cashier) cond.cashier = cashier;
  if (customer) cond.customer = customer;

  const match = { $match: cond };
  const group = {
    $group: {
      _id: null,
      invoices: { $sum: 1 },
      grossSales: { $sum: '$subtotal' },
      discounts: { $sum: '$discount' },
      tax: { $sum: '$tax' },
      netSales: { $sum: '$grandTotal' },
      cogs: { $sum: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.purchasePrice', '$$i.quantity'] } } } } },
      qtySold: { $sum: { $sum: { $map: { input: '$items', as: 'i', in: '$$i.quantity' } } } },
    },
  };

  const [summary] = await Sale.aggregate([match, group]);

  const returnMatch = { $match: { returnedAt: dateRange(from, to) } };
  const returnGroup = {
    $group: {
      _id: null,
      returnsCount: { $sum: 1 },
      returnsAmount: { $sum: '$refundAmount' },
    },
  };
  const [returnSummary] = await SalesReturn.aggregate([returnMatch, returnGroup]);

  const invoices = summary?.invoices || 0;
  const grossSales = summary?.grossSales || 0;
  const discounts = summary?.discounts || 0;
  const tax = summary?.tax || 0;
  const netSales = summary?.netSales || 0;
  const cogs = summary?.cogs || 0;
  const returnsAmount = returnSummary?.returnsAmount || 0;
  const returnsCount = returnSummary?.returnsCount || 0;

  return {
    invoices,
    grossSales,
    discounts,
    tax,
    returnsAmount,
    returnsCount,
    netSales,
    netSalesAfterReturns: netSales - returnsAmount,
    cogs,
    profit: netSales - returnsAmount - cogs,
    qtySold: summary?.qtySold || 0,
    averageInvoiceValue: invoices ? Math.round(netSales / invoices) : 0,
  };
}

async function productReport({ from, to, limit = 10 }) {
  const cond = { saleDate: dateRange(from, to), status: 'COMPLETED' };
  const unwind = { $unwind: '$items' };

  const rows = await Sale.aggregate([
    { $match: cond },
    unwind,
    {
      $group: {
        _id: '$items.product',
        productName: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
        cogs: { $sum: { $multiply: ['$items.purchasePrice', '$items.quantity'] } },
      },
    },
    { $addFields: { profit: { $subtract: ['$revenue', '$cogs'] } } },
    { $sort: { quantity: -1 } },
    { $limit: Math.max(20, Number(limit) || 10) },
  ]);

  const best = rows.slice(0, Number(limit) || 10);
  const worst = [...rows].reverse().slice(0, Number(limit) || 10);
  return { best, worst, rows };
}

async function categoryReport({ from, to }) {
  const Product = require('../models/Product');
  const cond = { saleDate: dateRange(from, to), status: 'COMPLETED' };

  const rows = await Sale.aggregate([
    { $match: cond },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
        cogs: { $sum: { $multiply: ['$items.purchasePrice', '$items.quantity'] } },
      },
    },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
    {
      $group: {
        _id: { $ifNull: [{ $arrayElemAt: ['$p.category', 0] }, null] },
        quantity: { $sum: '$quantity' },
        revenue: { $sum: '$revenue' },
        cogs: { $sum: '$cogs' },
      },
    },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] },
        quantity: 1,
        revenue: 1,
        profit: { $subtract: ['$revenue', '$cogs'] },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  return rows;
}

async function paymentReport({ from, to }) {
  const cond = { receivedAt: dateRange(from, to) };
  const rows = await Payment.aggregate([
    { $match: cond },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const totals = rows.reduce((s, r) => s + r.total, 0);
  return { rows, totals };
}

async function profitReport({ from, to }) {
  const sales = await salesReport({ from, to });
  const range = dateRange(from, to);

  const [expenseRow] = await Expense.aggregate([
    { $match: { date: range } },
    { $group: { _id: null, totalExpenses: { $sum: '$amount' }, expensesCount: { $sum: 1 } } },
  ]);

  const [purchaseRow] = await Purchase.aggregate([
    { $match: { purchaseDate: range } },
    { $group: { _id: null, totalPurchases: { $sum: '$total' } } },
  ]);

  const totalExpenses = expenseRow?.totalExpenses || 0;
  const grossProfit = sales.profit;
  const netProfit = grossProfit - totalExpenses;

  return {
    ...sales,
    totalExpenses,
    expensesCount: expenseRow?.expensesCount || 0,
    totalPurchases: purchaseRow?.totalPurchases || 0,
    grossProfit,
    netProfit,
  };
}

async function stockValue() {
  const rows = await ProductVariant.aggregate([
    {
      $group: {
        _id: null,
        stockOnHand: { $sum: '$stock' },
        stockValue: { $sum: { $multiply: ['$stock', '$purchasePrice'] } },
      },
    },
  ]);
  return rows[0] || { stockOnHand: 0, stockValue: 0 };
}

async function expenseReport({ from, to, category }) {
  const cond = { date: dateRange(from, to) };
  if (category) cond.category = category;
  const [total] = await Expense.aggregate([
    { $match: cond },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const byCategory = await Expense.aggregate([
    { $match: cond },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return {
    total: total?.total || 0,
    count: total?.count || 0,
    byCategory,
  };
}

module.exports = {
  salesReport,
  productReport,
  categoryReport,
  paymentReport,
  profitReport,
  stockValue,
  expenseReport,
};