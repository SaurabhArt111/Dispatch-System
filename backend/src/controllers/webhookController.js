const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const { ingestDC } = require('../services/dcIngestService');

// Receives a Delivery Challan pushed from System 1.
// Expected header: X-Webhook-Signature = HMAC_SHA256(rawBody, SYSTEM1_WEBHOOK_SECRET)
const receiveDC = asyncHandler(async (req, res) => {
  const secret = process.env.SYSTEM1_WEBHOOK_SECRET;
  const signature = req.headers['x-webhook-signature'];

  if (secret && signature) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
    if (expected !== signature) throw new ApiError(401, 'Invalid webhook signature');
  }

  const payload = req.body;
  if (!payload.sourceId || !payload.dcNumber) {
    throw new ApiError(400, 'Payload must include sourceId and dcNumber');
  }

  const result = await ingestDC(payload, { method: 'WEBHOOK' });
  return ok(res, { created: result.created, dcId: result.dc._id }, 'DC received', 201);
});

module.exports = { receiveDC };
