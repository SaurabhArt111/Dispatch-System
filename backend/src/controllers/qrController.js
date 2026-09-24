const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const Roll = require('../models/Roll');
const QRCode = require('../models/QRCode');
const qrService = require('../services/qrService');
const { logAction } = require('../services/auditService');

const generateQR = asyncHandler(async (req, res) => {
  const roll = await Roll.findById(req.params.rollId).populate('item').populate('dc').populate('godown');
  if (!roll) throw new ApiError(404, 'Roll not found');

  let qr = await QRCode.findOne({ roll: roll._id });
  if (!qr) {
    qr = await qrService.generateForRoll(roll, req.user?._id);
    roll.status = 'QR_GENERATED';
    await roll.save();
    await logAction({ actor: req.user?._id, action: 'QR_GENERATED', entityType: 'Roll', entityId: roll._id, ip: req.ip });
  }

  return ok(res, { qr, roll }, 'QR ready', 201);
});

const bulkGenerateQR = asyncHandler(async (req, res) => {
  const { rollIds } = req.body;
  if (!Array.isArray(rollIds) || rollIds.length === 0) throw new ApiError(400, 'rollIds[] required');

  const results = [];
  for (const id of rollIds) {
    const roll = await Roll.findById(id);
    if (!roll) continue;
    let qr = await QRCode.findOne({ roll: roll._id });
    if (!qr) {
      qr = await qrService.generateForRoll(roll, req.user?._id);
      roll.status = 'QR_GENERATED';
      await roll.save();
    }
    results.push(qr);
  }
  return ok(res, results, 'QR codes ready', 201);
});

const markPrinted = asyncHandler(async (req, res) => {
  const qr = await QRCode.findById(req.params.id);
  if (!qr) throw new ApiError(404, 'QR not found');
  qr.printedCount += 1;
  qr.lastPrintedAt = new Date();
  await qr.save();
  return ok(res, qr);
});

// Roll lookup by scanning the QR "code" -- returns everything the operator needs to see.
const lookupByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const qr = await QRCode.findOne({ code });
  if (!qr) throw new ApiError(404, 'QR code not recognized');

  const roll = await Roll.findById(qr.roll)
    .populate('item')
    .populate('dc')
    .populate('godown');
  if (!roll) throw new ApiError(404, 'Roll not found for this QR');

  return ok(res, {
    roll: {
      id: roll._id,
      rollId: roll.rollId,
      qty: roll.qty,
      status: roll.status,
      godown: roll.godown ? { code: roll.godown.code, name: roll.godown.name } : null
    },
    dc: roll.dc ? { dcNumber: roll.dc.dcNumber, billTo: roll.dc.billTo } : null,
    item: roll.item ? { itemName: roll.item.itemName, screenName: roll.item.screenName } : null
  });
});

module.exports = { generateQR, bulkGenerateQR, markPrinted, lookupByCode };
