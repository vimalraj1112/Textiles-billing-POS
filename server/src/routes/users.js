const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const User = require('../models/User');
const { apiSuccess, apiError } = require('../utils/respond');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../services/auditService');
const {
  userCreateSchema,
  userUpdateSchema,
  passwordResetSchema,
} = require('../validators/authValidator');

const router = Express.Router();
router.use(auth, authorize(ROLES.ADMIN));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);
    const cond = {};
    if (req.query.search) {
      cond.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.role) cond.role = req.query.role;
    const [total, items] = await Promise.all([
      User.countDocuments(cond),
      User.find(cond).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    ]);
    return apiSuccess(res, paginatedResponse(items, total, page, limit), 'Employees fetched');
  })
);

router.post(
  '/',
  validate(userCreateSchema),
  asyncHandler(async (req, res) => {
    const data = await User.create(req.body);
    await logAudit({ user: req.user, action: 'CREATE_USER', entity: 'User', entityId: data._id, description: `Created user: ${data.name} (${data.role})`, ip: req.ip });
    return apiSuccess(res, data.toSafeJSON(), 'Employee created', 201);
  })
);

router.put(
  '/:id',
  validate(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return apiError(res, 404, 'Employee not found');
    Object.assign(user, req.body);
    await user.save();
    await logAudit({ user: req.user, action: 'UPDATE_USER', entity: 'User', entityId: user._id, description: `Updated user: ${user.name}`, ip: req.ip });
    return apiSuccess(res, user.toSafeJSON(), 'Employee updated');
  })
);

router.post(
  '/:id/reset-password',
  validate(passwordResetSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return apiError(res, 404, 'Employee not found');
    user.password = req.body.password;
    await user.save();
    return apiSuccess(res, null, 'Password reset successful');
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.userId) return apiError(res, 400, 'Cannot delete your own account');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return apiError(res, 404, 'Employee not found');
    await logAudit({ user: req.user, action: 'DELETE_USER', entity: 'User', entityId: user._id, description: `Deleted user: ${user.name}`, ip: req.ip });
    return apiSuccess(res, user.toSafeJSON(), 'Employee deleted');
  })
);

module.exports = router;