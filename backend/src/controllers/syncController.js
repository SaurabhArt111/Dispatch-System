const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const SyncLog = require('../models/SyncLog');
const mockSystem1 = require('../services/mockSystem1');
const { ingestDC } = require('../services/dcIngestService');

const listSyncLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = await SyncLog.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await SyncLog.countDocuments();
  return ok(res, { logs, total, page: Number(page), limit: Number(limit) });
});

// Manually trigger a mock DC to arrive, for demoing the real-time pipeline live.
const triggerMockDC = asyncHandler(async (req, res) => {
  const payload = mockSystem1.generateMockDC();
  const result = await ingestDC(payload, { method: 'MANUAL' });
  return ok(res, result, 'Mock DC generated and ingested', 201);
});

module.exports = { listSyncLogs, triggerMockDC };
