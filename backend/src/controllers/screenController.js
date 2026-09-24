const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const GodownScreen = require('../models/GodownScreen');

// Godown TV enters the pairing code once; receives a long-lived token afterwards.
const pairScreen = asyncHandler(async (req, res) => {
  const { pairingCode } = req.body;
  if (!pairingCode) throw new ApiError(400, 'pairingCode is required');

  const screen = await GodownScreen.findOne({ pairingCode }).populate('godown');
  if (!screen) throw new ApiError(404, 'Invalid pairing code');

  const token = jwt.sign({ screenId: screen._id.toString() }, process.env.SCREEN_PAIRING_SECRET, {
    expiresIn: '3650d'
  });

  screen.isPaired = true;
  screen.pairingToken = token;
  screen.isOnline = true;
  screen.lastSeenAt = new Date();
  await screen.save();

  return ok(res, {
    token,
    godown: { id: screen.godown._id, code: screen.godown.code, name: screen.godown.name },
    deviceLabel: screen.deviceLabel
  }, 'Screen paired successfully');
});

const heartbeat = asyncHandler(async (req, res) => {
  req.screen.lastSeenAt = new Date();
  req.screen.isOnline = true;
  await req.screen.save();
  return ok(res, { serverTime: new Date().toISOString() });
});

const whoami = asyncHandler(async (req, res) => {
  return ok(res, {
    godown: { id: req.screen.godown._id, code: req.screen.godown.code, name: req.screen.godown.name },
    deviceLabel: req.screen.deviceLabel
  });
});

module.exports = { pairScreen, heartbeat, whoami };
