const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const { Sale } = require('../models/Sale');
const ApiError = require('../utils/ApiError');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const { isValidObjectId } = require('mongoose');

async function listCustomers(query) {
  const { page, limit, skip } = buildPagination(query);
  const { search, status } = query;

  const cond = {};
  if (search) {
    cond.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) cond.status = status;

  const [total, items] = await Promise.all([
    Customer.countDocuments(cond),
    Customer.find(cond).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function searchCustomers(search) {
  if (!search) return [];
  return Customer.find({
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ],
  })
    .limit(10)
    .sort({ createdAt: -1 });
}

async function getCustomerById(id) {
  if (!isValidObjectId(id)) throw new ApiError(400, 'Invalid customer id');
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const [sales, returns, loyalty] = await Promise.all([
    Sale.find({ customer: id, status: 'COMPLETED' }).sort({ saleDate: -1 }).limit(20),
    require('../models/Return').SalesReturn.find({ customer: id }).sort({ returnedAt: -1 }).limit(20),
    require('../models/LoyaltyTransaction').find({ customer: id }).sort({ createdAt: -1 }).limit(20),
  ]);

  return { ...customer.toObject(), sales, returns, loyalty };
}

async function createCustomer(payload) {
  return Customer.create(payload);
}

async function updateCustomer(id, payload) {
  const customer = await Customer.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  Object.assign(customer, payload);
  return customer.save();
}

async function saveCustomerIfNeeded(payload) {
  if (!payload) return null;
  const { phone, email, name } = payload;
  let customer = null;
  if (phone) customer = await Customer.findOne({ phone });
  else if (email) customer = await Customer.findOne({ email });
  if (customer) return { customer, isNew: false };
  const created = await Customer.create({ name: name || 'Walk-in Customer', phone, email });
  return { customer: created, isNew: true };
}

async function listSuppliers(query) {
  const { page, limit, skip } = buildPagination(query);
  const { search, status } = query;

  const cond = {};
  if (search) {
    cond.$or = [
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) cond.status = status;

  const [total, items] = await Promise.all([
    Supplier.countDocuments(cond),
    Supplier.find(cond).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return paginatedResponse(items, total, page, limit);
}

async function getSupplierById(id) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  const { Purchase } = require('../models/Purchase');
  const purchases = await Purchase.find({ supplier: id }).sort({ purchaseDate: -1 }).limit(20);
  const totalInfo = await Purchase.aggregate([
    { $match: { supplier: id } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: '$total' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
      },
    },
  ]);
  return {
    ...supplier.toObject(),
    purchases,
    summary: totalInfo[0] || { totalPurchases: 0, totalPaid: 0, totalDue: 0 },
  };
}

async function createSupplier(payload) {
  return Supplier.create(payload);
}

async function updateSupplier(id, payload) {
  const supplier = await Supplier.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  Object.assign(supplier, payload);
  return supplier.save();
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  searchCustomers,
  saveCustomerIfNeeded,
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
};