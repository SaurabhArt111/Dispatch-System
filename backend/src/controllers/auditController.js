const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const AuditLog = require('../models/AuditLog');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action } = req.query;
  const query = action ? { action } : {};
  const logs = await AuditLog.find(query)
    .populate('actor', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await AuditLog.countDocuments(query);
  return ok(res, { logs, total, page: Number(page), limit: Number(limit) });
});

module.exports = { listAuditLogs };
