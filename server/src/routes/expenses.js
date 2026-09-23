const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES, EXPENSE_CATEGORIES } = require('../constants');
const Expense = require('../models/Expense');
const { apiSuccess } = require('../utils/respond');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../services/auditService');
const { expenseSchema } = require('../validators/businessValidator');

const router = Express.Router();
router.use(auth);

router.get(
  '/categories',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => apiSuccess(res, Object.values(EXPENSE_CATEGORIES), 'Expense categories'))
);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);
    const cond = {};
    if (req.query.category) cond.category = req.query.category;
    if (req.query.from || req.query.to) {
      cond.date = {};
      if (req.query.from) cond.date.$gte = new Date(req.query.from);
      if (req.query.to) cond.date.$lte = new Date(req.query.to);
    }
    const [total, items] = await Promise.all([
      Expense.countDocuments(cond),
      Expense.find(cond).populate('createdBy', 'name').sort({ date: -1 }).skip(skip).limit(limit),
    ]);
    return apiSuccess(res, paginatedResponse(items, total, page, limit), 'Expenses fetched');
  })
);

router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(expenseSchema),
  asyncHandler(async (req, res) => {
    const data = await Expense.create({
      ...req.body,
      amount: Math.round(Number(req.body.amount) * 100),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      createdBy: req.userId,
    });
    await logAudit({ user: req.user, action: 'CREATE_EXPENSE', entity: 'Expense', entityId: data._id, description: `Expense: ${data.title}`, ip: req.ip });
    return apiSuccess(res, data, 'Expense added', 201);
  })
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found', errors: [] });
    }
    const patch = { ...req.body };
    if (patch.amount !== undefined) patch.amount = Math.round(Number(patch.amount) * 100);
    Object.assign(expense, patch);
    await expense.save();
    return apiSuccess(res, expense, 'Expense updated');
  })
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found', errors: [] });
    }
    return apiSuccess(res, expense, 'Expense deleted');
  })
);

module.exports = router;