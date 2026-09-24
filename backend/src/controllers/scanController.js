const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const QRCode = require('../models/QRCode');
const Roll = require('../models/Roll');
const { logAction } = require('../services/auditService');

// Generic "scan" step used in the Packed -> QR -> Print -> Scan -> Verify flow.
// Prevents the same roll from being scanned twice for the same stage.
const scanRoll = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new ApiError(400, 'QR code value is required');

  const qr = await QRCode.findOne({ code });
  if (!qr) throw new ApiError(404, 'QR code not recognized');

  const roll = await Roll.findById(qr.roll).populate('item').populate('dc').populate('godown');
  if (!roll) throw new ApiError(404, 'Roll not found');

  if (roll.status === 'SCANNED' || roll.status === 'LOADED' || roll.status === 'DISPATCHED') {
    throw new ApiError(409, `Roll ${roll.rollId} was already scanned (current status: ${roll.status})`);
  }

  roll.status = 'SCANNED';
  roll.scannedAt = new Date();
  await roll.save();

  await logAction({ actor: req.user?._id, action: 'ROLL_SCANNED', entityType: 'Roll', entityId: roll._id, ip: req.ip });

  return ok(res, {
    roll: {
      id: roll._id,
      rollId: roll.rollId,
      qty: roll.qty,
      status: roll.status,
      godown: roll.godown ? { code: roll.godown.code } : null
    },
    dc: roll.dc ? { dcNumber: roll.dc.dcNumber, billTo: roll.dc.billTo } : null,
    item: roll.item ? { itemName: roll.item.itemName } : null
  }, 'Roll verified and scanned');
});

module.exports = { scanRoll };
