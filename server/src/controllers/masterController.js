const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const { Category, Brand, Size, Color } = require('../models/masterModels');

const registry = {
  category: { Model: Category, options: { referenceModel: require('../models/Product'), referenceField: 'category' } },
  brand: { Model: Brand, options: { referenceModel: require('../models/Product'), referenceField: 'brand' } },
  size: { Model: Size, options: {} },
  color: { Model: Color, options: {} },
};

function controllerFor(type) {
  const { Model, options } = registry[type];
  const service = require('../services/masterService')(Model, options);
  const auditMap = {
    category: { create: 'CREATE_PRODUCT', update: 'UPDATE_PRODUCT', remove: 'DELETE_PRODUCT' },
    brand: { create: 'CREATE_PRODUCT', update: 'UPDATE_PRODUCT', remove: 'DELETE_PRODUCT' },
    size: { create: 'CREATE_PRODUCT', update: 'UPDATE_PRODUCT', remove: 'DELETE_PRODUCT' },
    color: { create: 'CREATE_PRODUCT', update: 'UPDATE_PRODUCT', remove: 'DELETE_PRODUCT' },
  };

  return {
    list: asyncHandler(async (req, res) => {
      const data = await service.list(req.query);
      return apiSuccess(res, data, `${type}s fetched`);
    }),
    all: asyncHandler(async (req, res) => {
      const data = await service.getAll();
      return apiSuccess(res, data, `${type}s fetched`);
    }),
    getOne: asyncHandler(async (req, res) => {
      const data = await service.getById(req.params.id);
      return apiSuccess(res, data, `${type} fetched`);
    }),
    create: asyncHandler(async (req, res) => {
      const data = await service.create(req.body);
      const logAudit = require('../services/auditService');
      await logAudit({ user: req.user, action: auditMap[type].create, entity: type, entityId: data._id, description: `Created ${type}: ${data.name}`, ip: req.ip });
      return apiSuccess(res, data, `${type} created successfully`, 201);
    }),
    update: asyncHandler(async (req, res) => {
      const data = await service.update(req.params.id, req.body);
      const logAudit = require('../services/auditService');
      await logAudit({ user: req.user, action: auditMap[type].update, entity: type, entityId: data._id, description: `Updated ${type}: ${data.name}`, ip: req.ip });
      return apiSuccess(res, data, `${type} updated successfully`);
    }),
    remove: asyncHandler(async (req, res) => {
      const data = await service.remove(req.params.id);
      const logAudit = require('../services/auditService');
      await logAudit({ user: req.user, action: auditMap[type].remove, entity: type, entityId: data._id, description: `Deleted ${type}: ${data.name}`, ip: req.ip });
      return apiSuccess(res, data, `${type} deleted`);
    }),
  };
}

module.exports = { controllerFor };