const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logAudit = require('./auditService');

const signToken = (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

async function loginService({ email, password, ip }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  if (user.status !== 'ACTIVE') throw new ApiError(403, 'Account is deactivated. Contact admin.');

  user.lastLogin = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  await logAudit({
    user,
    action: 'LOGIN',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} logged in`,
    ip,
  });

  return { token, user: user.toSafeJSON() };
}

async function meService(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return user.toSafeJSON();
}

module.exports = { loginService, meService, signToken };