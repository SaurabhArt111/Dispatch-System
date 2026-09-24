const AuditLog = require('../models/AuditLog');

async function logAction({ actor, actorLabel, action, entityType, entityId, details, ip }) {
  try {
    await AuditLog.create({ actor, actorLabel, action, entityType, entityId, details, ip });
  } catch (e) {
    console.error('[audit] failed to write audit log', e.message);
  }
}

module.exports = { logAction };
