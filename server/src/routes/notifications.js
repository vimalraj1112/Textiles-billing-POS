const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../constants');
const Notification = require('../models/Notification');
const { apiSuccess } = require('../utils/respond');
const { buildPagination, paginatedResponse } = require('../utils/pagination');
const asyncHandler = require('../utils/asyncHandler');

const router = Express.Router();
router.use(auth);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const query = {
      $or: [{ forRoles: { $size: 0 } }, { forRoles: req.user.role }],
    };
    const [total, items, unread] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query).sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit)),
      Notification.countDocuments({ ...query, read: false }),
    ]);
    const data = {
      ...paginatedResponse(items, total, Number(page), Number(limit)),
      unread,
    };
    return apiSuccess(res, data, 'Notifications fetched');
  })
);

router.post(
  '/read-all',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { $or: [{ forRoles: { $size: 0 } }, { forRoles: req.user.role }] },
      { $set: { read: true } }
    );
    return apiSuccess(res, null, 'All notifications marked as read');
  })
);

router.post(
  '/:id/read',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    await Notification.updateOne({ _id: req.params.id }, { $set: { read: true } });
    return apiSuccess(res, null, 'Notification marked as read');
  })
);

module.exports = router;