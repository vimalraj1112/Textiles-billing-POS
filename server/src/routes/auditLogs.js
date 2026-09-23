const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../constants');
const AuditLog = require('../models/AuditLog');
const { apiSuccess } = require('../utils/respond');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const asyncHandler = require('../utils/asyncHandler');

const router = Express.Router();
router.use(auth, authorize(ROLES.ADMIN));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);
    const cond = {};
    if (req.query.action) cond.action = req.query.action;
    if (req.query.userId) cond.user = req.query.userId;
    if (req.query.from || req.query.to) {
      cond.createdAt = {};
      if (req.query.from) cond.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) cond.createdAt.$lte = new Date(req.query.to);
    }
    const [total, items] = await Promise.all([
      AuditLog.countDocuments(cond),
      AuditLog.find(cond).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    return apiSuccess(res, paginatedResponse(items, total, page, limit), 'Audit logs fetched');
  })
);

module.exports = router;