const { Sale, Payment } = require('../models/Sale');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Customer = require('../models/Customer');
const { SalesReturn } = require('../models/Return');
const { Purchase } = require('../models/Purchase');
const reportService = require('./reportService');

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

async function kpis() {
  const today = startOfDay();
  const [todayAgg, totalProducts, lowStock, pending] = await Promise.all([
    Sale.aggregate([
      { $match: { saleDate: { $gte: today }, status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          invoices: { $sum: 1 },
          gross: { $sum: '$grandTotal' },
          cogs: {
            $sum: { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.purchasePrice', '$$i.quantity'] } } } },
          },
        },
      },
    ]),
    Product.countDocuments({ status: 'ACTIVE' }),
    ProductVariant.countDocuments({ $expr: { $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$minimumStock', 0] }] } }),
    Customer.aggregate([
      { $group: { _id: null, outstanding: { $sum: '$outstandingAmount' }, customers: { $sum: { $cond: [{ $gt: ['$outstandingAmount', 0] }, 1, 0] } } } },
    ]),
  ]);

  const row = todayAgg[0] || { invoices: 0, gross: 0, cogs: 0 };
  const pendingRow = pending[0] || { outstanding: 0, customers: 0 };

  return {
    todaySales: row.gross,
    todayOrders: row.invoices,
    todayProfit: row.gross - row.cogs,
    totalProducts,
    lowStockProducts: lowStock,
    pendingPayments: pendingRow.outstanding,
    pendingCustomers: pendingRow.customers,
  };
}

async function salesChart(days = 7) {
  const start = startOfDay();
  start.setDate(start.getDate() - (days - 1));
  const rows = await Sale.aggregate([
    { $match: { saleDate: { $gte: start }, status: 'COMPLETED' } },
    {
      $group: {
        _id: {
          year: { $year: '$saleDate' },
          month: { $month: '$saleDate' },
          day: { $dayOfMonth: '$saleDate' },
        },
        sales: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
        profit: {
          $sum: { $subtract: ['$grandTotal', { $sum: { $map: { input: '$items', as: 'i', in: { $multiply: ['$$i.purchasePrice', '$$i.quantity'] } } } }] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  const result = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const found = rows.find(
      (r) => `${r._id.year}-${r._id.month}-${r._id.day}` === key
    );
    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      sales: found?.sales || 0,
      orders: found?.orders || 0,
      profit: found?.profit || 0,
    });
  }
  return result;
}

async function salesByYear() {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const rows = await Sale.aggregate([
    { $match: { saleDate: { $gte: start }, status: 'COMPLETED' } },
    {
      $group: {
        _id: { month: { $month: '$saleDate' } },
        sales: { $sum: '$grandTotal' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((m, idx) => {
    const row = rows.find((r) => r._id.month === idx + 1);
    return { month: m, sales: row?.sales || 0 };
  });
}

async function recentTransactions(limit = 8) {
  return Sale.find({ status: 'COMPLETED' })
    .populate('customer', 'name phone')
    .limit(Number(limit) || 8)
    .sort({ saleDate: -1, createdAt: -1 });
}

async function topProducts(limit = 5) {
  const rows = await Sale.aggregate([
    { $match: { status: 'COMPLETED' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        sold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: Number(limit) || 5 },
  ]);
  return rows;
}

async function lowStockList(limit = 6) {
  return ProductVariant.find({ $expr: { $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$minimumStock', 0] }] } })
    .populate('product', 'name sku')
    .populate('size', 'name')
    .populate('color', 'name')
    .limit(Number(limit) || 6)
    .sort({ stock: 1 });
}

async function recentReturns(limit = 6) {
  return SalesReturn.find().populate('sale', 'invoiceNumber').populate('customer', 'name').limit(Number(limit) || 6).sort({ returnedAt: -1 });
}

async function recentPurchases(limit = 6) {
  return Purchase.find().populate('supplier', 'name').limit(Number(limit) || 6).sort({ purchaseDate: -1 });
}

async function paymentSummary() {
  const today = startOfDay();
  const rows = await Payment.aggregate([
    { $match: { receivedAt: { $gte: today } } },
    { $group: { _id: '$method', total: { $sum: '$amount' } } },
  ]);
  return rows.map((r) => ({ method: r._id, total: r.total }));
}

async function dashboardData({ days = 7 } = {}) {
  const [kpi, chart, yearly, recent, top, lowStock, returns, purchases, payments, stockVal] = await Promise.all([
    kpis(),
    salesChart(Number(days)),
    salesByYear(),
    recentTransactions(),
    topProducts(),
    lowStockList(),
    recentReturns(),
    recentPurchases(),
    paymentSummary(),
    reportService.stockValue(),
  ]);

  return {
    kpis: kpi,
    chart: { days: Number(days), data: chart },
    yearlySales: yearly,
    recentTransactions: recent,
    topProducts: top,
    lowStock: lowStock,
    recentReturns: returns,
    recentPurchases: purchases,
    paymentSummary: payments,
    stockValue: stockVal,
  };
}

module.exports = { dashboardData, kpis, salesChart, salesByYear };