const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/respond');
const { loginService, meService } = require('../services/authService');
const logAudit = require('../services/auditService');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress;
  const data = await loginService({ email, password, ip });
  return apiSuccess(res, data, 'Login successful');
});

const me = asyncHandler(async (req, res) => {
  const user = await meService(req.userId);
  return apiSuccess(res, user, 'User fetched');
});

const logout = asyncHandler(async (req, res) => {
  await logAudit({
    user: req.user,
    action: 'LOGOUT',
    entity: 'User',
    entityId: req.userId,
    description: `${req.user.name} logged out`,
    ip: req.ip,
  });
  return apiSuccess(res, null, 'Logged out successfully');
});

module.exports = { login, me, logout };