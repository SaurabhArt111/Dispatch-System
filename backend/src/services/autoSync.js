/**
 * Optional background poller that periodically checks System 1 for new DCs
 * (used mainly in mock/demo mode to simulate DCs arriving in real time).
 * The webhook route (routes/webhookRoutes.js) is the primary, push-based path.
 */
const system1Service = require('./system1Service');
const { ingestDC } = require('./dcIngestService');
const logger = require('../utils/logger');

function startAutoSync({ intervalMs = 45000, enabled = true } = {}) {
  if (!enabled) return null;

  const timer = setInterval(async () => {
    try {
      const payloads = await system1Service.pollForNewDCs();
      for (const payload of payloads) {
        await ingestDC(payload, { method: 'POLL' });
      }
    } catch (e) {
      logger.warn(`[autoSync] poll failed: ${e.message}`);
    }
  }, intervalMs);

  logger.info(`[autoSync] started, polling every ${intervalMs / 1000}s (mock=${process.env.USE_MOCK_SYSTEM1 !== 'false'})`);
  return timer;
}

module.exports = { startAutoSync };
