const Express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');
const { getSettings, updateSettings } = require('../services/settingsService');
const { apiSuccess } = require('../utils/respond');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../services/auditService');
const { settingsSchema } = require('../validators/settingsValidator');

const router = Express.Router();
router.use(auth);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER),
  asyncHandler(async (req, res) => {
    const settings = await getSettings();
    return apiSuccess(res, settings, 'Settings fetched');
  })
);

router.put(
  '/',
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await updateSettings(req.body, req.userId);
    await logAudit({ user: req.user, action: 'UPDATE_SETTINGS', entity: 'Setting', entityId: null, description: 'Updated shop settings', ip: req.ip });
    return apiSuccess(res, settings, 'Settings updated');
  })
);

module.exports = router;