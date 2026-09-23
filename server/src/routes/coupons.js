const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const Coupon = require('../models/Coupon');
const { apiSuccess, apiError } = require('../utils/respond');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../services/auditService');
const ApiError = require('../utils/ApiError');
const { couponSchema } = require('../validators/businessValidator');

const router = Express.Router();
router.use(auth);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);
    const cond = {};
    if (req.query.search) cond.code = { $regex: req.query.search, $options: 'i' };
    const [total, items] = await Promise.all([
      Coupon.countDocuments(cond),
      Coupon.find(cond).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    return apiSuccess(res, paginatedResponse(items, total, page, limit), 'Coupons fetched');
  })
);

router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(couponSchema),
  asyncHandler(async (req, res) => {
    const data = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase().trim(),
    });
    await logAudit({ user: req.user, action: 'CREATE_COUPON', entity: 'Coupon', entityId: data._id, description: `Created coupon: ${data.code}`, ip: req.ip });
    return apiSuccess(res, data, 'Coupon created', 201);
  })
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(couponSchema.partial()),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    const patch = { ...req.body };
    if (patch.code) patch.code = patch.code.toUpperCase().trim();
    Object.assign(coupon, patch);
    await coupon.save();
    await logAudit({ user: req.user, action: 'UPDATE_COUPON', entity: 'Coupon', entityId: coupon._id, description: `Updated coupon: ${coupon.code}`, ip: req.ip });
    return apiSuccess(res, coupon, 'Coupon updated');
  })
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return apiError(res, 404, 'Coupon not found');
    return apiSuccess(res, coupon, 'Coupon deleted');
  })
);

module.exports = router;