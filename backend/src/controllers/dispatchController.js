const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const Dispatch = require('../models/Dispatch');
const Roll = require('../models/Roll');
const DeliveryChallan = require('../models/DeliveryChallan');
const { logAction } = require('../services/auditService');
const { notifyRoom } = require('../services/notificationService');

// Dispatch office overview board
const getBoard = asyncHandler(async (req, res) => {
  const packed = await Roll.countDocuments({ status: 'CREATED' });
  const qrGenerated = await Roll.countDocuments({ status: 'QR_GENERATED' });
  const scanned = await Roll.countDocuments({ status: 'SCANNED' });
  const loaded = await Roll.countDocuments({ status: 'LOADED' });
  const dispatched = await Roll.countDocuments({ status: 'DISPATCHED' });
  return ok(res, { packed, qrGenerated, ready: scanned, loaded, dispatched });
});

// Start a loading session for a DC + vehicle, with the set of rolls expected to be loaded.
const startLoading = asyncHandler(async (req, res) => {
  const { dcId, vehicleId, rollIds } = req.body;
  if (!dcId || !vehicleId || !Array.isArray(rollIds) || rollIds.length === 0) {
    throw new ApiError(400, 'dcId, vehicleId and rollIds[] are required');
  }
  const dispatch = await Dispatch.create({
    dc: dcId,
    vehicle: vehicleId,
    expectedRolls: rollIds,
    loadedRolls: [],
    status: 'LOADING'
  });
  return ok(res, dispatch, 'Loading session started', 201);
});

// Scan a roll into the loading session; verifies it belongs to expected set & isn't a duplicate.
const scanIntoLoad = asyncHandler(async (req, res) => {
  const { rollId } = req.body;
  const dispatch = await Dispatch.findById(req.params.id);
  if (!dispatch) throw new ApiError(404, 'Loading session not found');

  const roll = await Roll.findById(rollId);
  if (!roll) throw new ApiError(404, 'Roll not found');

  if (!dispatch.expectedRolls.some((r) => r.toString() === rollId)) {
    throw new ApiError(400, `${roll.rollId} is not part of this dispatch's expected rolls`);
  }
  if (dispatch.loadedRolls.some((r) => r.toString() === rollId)) {
    throw new ApiError(409, `${roll.rollId} has already been loaded`);
  }
  if (roll.status === 'LOADED' || roll.status === 'DISPATCHED') {
    throw new ApiError(409, `${roll.rollId} is already loaded/dispatched elsewhere`);
  }

  dispatch.loadedRolls.push(roll._id);
  await dispatch.save();

  roll.status = 'LOADED';
  roll.loadedAt = new Date();
  await roll.save();

  const allLoaded = dispatch.expectedRolls.length === dispatch.loadedRolls.length;
  return ok(res, { dispatch, allLoaded }, allLoaded ? 'All rolls loaded' : 'Roll loaded');
});

const confirmLoaded = asyncHandler(async (req, res) => {
  const dispatch = await Dispatch.findById(req.params.id);
  if (!dispatch) throw new ApiError(404, 'Loading session not found');
  if (dispatch.loadedRolls.length !== dispatch.expectedRolls.length) {
    throw new ApiError(400, 'Not all expected rolls have been scanned/loaded yet');
  }
  dispatch.status = 'LOADED';
  dispatch.loadedBy = req.user._id;
  dispatch.loadedAt = new Date();
  await dispatch.save();
  return ok(res, dispatch, 'Vehicle loading confirmed');
});

const markDispatched = asyncHandler(async (req, res) => {
  const dispatch = await Dispatch.findById(req.params.id).populate('dc');
  if (!dispatch) throw new ApiError(404, 'Loading session not found');
  if (dispatch.status !== 'LOADED') throw new ApiError(400, 'Vehicle must be fully loaded before dispatch');

  dispatch.status = 'DISPATCHED';
  dispatch.dispatchedBy = req.user._id;
  dispatch.dispatchedAt = new Date();
  await dispatch.save();

  await Roll.updateMany(
    { _id: { $in: dispatch.loadedRolls } },
    { status: 'DISPATCHED', dispatchedAt: new Date() }
  );

  await logAction({ actor: req.user._id, action: 'DC_DISPATCHED', entityType: 'Dispatch', entityId: dispatch._id, ip: req.ip });
  await notifyRoom('dispatch-office', {
    type: 'DISPATCHED',
    title: 'Vehicle dispatched',
    message: `${dispatch.dc.dcNumber} has been dispatched`,
    payload: { dispatchId: dispatch._id }
  });

  return ok(res, dispatch, 'Marked as dispatched');
});

const listDispatches = asyncHandler(async (req, res) => {
  const dispatches = await Dispatch.find()
    .populate('dc')
    .populate('vehicle')
    .populate('expectedRolls')
    .populate('loadedRolls')
    .sort({ createdAt: -1 });
  return ok(res, dispatches);
});

module.exports = { getBoard, startLoading, scanIntoLoad, confirmLoaded, markDispatched, listDispatches };
