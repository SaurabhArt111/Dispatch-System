const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const Godown = require('../models/Godown');
const GodownScreen = require('../models/GodownScreen');
const GodownJob = require('../models/GodownJob');
const { pairingCode } = require('../utils/idGenerator');
const { logAction } = require('../services/auditService');

const listGodowns = asyncHandler(async (req, res) => {
  const godowns = await Godown.find().sort({ code: 1 });
  const withCounts = await Promise.all(
    godowns.map(async (g) => {
      const pendingJobs = await GodownJob.countDocuments({
        godown: g._id,
        status: { $nin: ['READY_FOR_DISPATCH'] }
      });
      return { ...g.toObject(), pendingJobs };
    })
  );
  return ok(res, withCounts);
});

const createGodown = asyncHandler(async (req, res) => {
  const { code, name, location } = req.body;
  if (!code || !name) throw new ApiError(400, 'code and name are required');
  const exists = await Godown.findOne({ code: code.toUpperCase() });
  if (exists) throw new ApiError(409, 'Godown code already exists');
  const godown = await Godown.create({ code: code.toUpperCase(), name, location });
  await logAction({ actor: req.user._id, action: 'GODOWN_CREATED', entityType: 'Godown', entityId: godown._id, ip: req.ip });
  return ok(res, godown, 'Godown created', 201);
});

const updateGodown = asyncHandler(async (req, res) => {
  const { name, location, isActive } = req.body;
  const godown = await Godown.findById(req.params.id);
  if (!godown) throw new ApiError(404, 'Godown not found');
  if (name !== undefined) godown.name = name;
  if (location !== undefined) godown.location = location;
  if (isActive !== undefined) godown.isActive = isActive;
  await godown.save();
  return ok(res, godown, 'Godown updated');
});

// Create (or fetch existing) pairing code for a screen, so an admin can display it
// and a TV device can enter it once to obtain a long-lived screen token.
const createScreenPairing = asyncHandler(async (req, res) => {
  const godown = await Godown.findById(req.params.id);
  if (!godown) throw new ApiError(404, 'Godown not found');
  const { deviceLabel } = req.body;

  const screen = await GodownScreen.create({
    godown: godown._id,
    deviceLabel: deviceLabel || 'Main TV',
    pairingCode: pairingCode(),
    isPaired: false
  });

  await logAction({ actor: req.user._id, action: 'SCREEN_PAIRING_CREATED', entityType: 'GodownScreen', entityId: screen._id, ip: req.ip });
  return ok(res, screen, 'Pairing code generated', 201);
});

const listScreens = asyncHandler(async (req, res) => {
  const screens = await GodownScreen.find().populate('godown').sort({ createdAt: -1 });
  return ok(res, screens);
});

module.exports = { listGodowns, createGodown, updateGodown, createScreenPairing, listScreens };
