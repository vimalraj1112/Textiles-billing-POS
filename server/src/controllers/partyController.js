const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const partyService = require('../services/partyService');
const logAudit = require('../services/auditService');

const listCustomers = asyncHandler(async (req, res) => {
  const data = await partyService.listCustomers(req.query);
  return apiSuccess(res, data, 'Customers fetched');
});

const getCustomer = asyncHandler(async (req, res) => {
  const data = await partyService.getCustomerById(req.params.id);
  return apiSuccess(res, data, 'Customer fetched');
});

const createCustomer = asyncHandler(async (req, res) => {
  const data = await partyService.createCustomer(req.body);
  await logAudit({ user: req.user, action: 'CREATE_CUSTOMER', entity: 'Customer', entityId: data._id, description: `Created customer: ${data.name}`, ip: req.ip });
  return apiSuccess(res, data, 'Customer created successfully', 201);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const data = await partyService.updateCustomer(req.params.id, req.body);
  await logAudit({ user: req.user, action: 'UPDATE_CUSTOMER', entity: 'Customer', entityId: data._id, description: `Updated customer: ${data.name}`, ip: req.ip });
  return apiSuccess(res, data, 'Customer updated successfully');
});

const quickCreateCustomer = asyncHandler(async (req, res) => {
  const data = await partyService.saveCustomerIfNeeded(req.body);
  return apiSuccess(res, data.customer, 'Customer saved', data.isNew ? 201 : 200);
});

const listSuppliers = asyncHandler(async (req, res) => {
  const data = await partyService.listSuppliers(req.query);
  return apiSuccess(res, data, 'Suppliers fetched');
});

const getSupplier = asyncHandler(async (req, res) => {
  const data = await partyService.getSupplierById(req.params.id);
  return apiSuccess(res, data, 'Supplier fetched');
});

const createSupplier = asyncHandler(async (req, res) => {
  const data = await partyService.createSupplier(req.body);
  await logAudit({ user: req.user, action: 'CREATE_SUPPLIER', entity: 'Supplier', entityId: data._id, description: `Created supplier: ${data.name}`, ip: req.ip });
  return apiSuccess(res, data, 'Supplier created successfully', 201);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const data = await partyService.updateSupplier(req.params.id, req.body);
  await logAudit({ user: req.user, action: 'UPDATE_SUPPLIER', entity: 'Supplier', entityId: data._id, description: `Updated supplier: ${data.name}`, ip: req.ip });
  return apiSuccess(res, data, 'Supplier updated successfully');
});

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  quickCreateCustomer,
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
};