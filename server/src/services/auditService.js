const AuditLog = require('../models/AuditLog');

async function logAudit({ user, action, entity, entityId, description, ip }) {
  try {
    const name = user ? (user.name || user.email || 'System') : 'System';
    await AuditLog.create({
      user: user ? user._id : null,
      userName: name,
      role: user ? user.role : null,
      action,
      entity,
      entityId,
      description,
      ip,
    });
  } catch (error) {
    console.error('[audit] failed to write log:', error.message);
  }
}

module.exports = logAudit;