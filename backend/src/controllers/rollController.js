const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const GodownJob = require('../models/GodownJob');
const DeliveryItem = require('../models/DeliveryItem');
const Roll = require('../models/Roll');
const { rollId: buildRollId } = require('../utils/idGenerator');
const { logAction } = require('../services/auditService');
const { notifyRoom } = require('../services/notificationService');

/**
 * Create physical Roll records for a job's item.
 * body: { itemId, rolls: [{ qty }, { qty }, ...], override: bool, overrideReason }
 * Validates that the sum of roll quantities matches the item qty unless override=true.
 */
const createRolls = asyncHandler(async (req, res) => {
  const { itemId, rolls, override, overrideReason } = req.body;
  if (!itemId || !Array.isArray(rolls) || rolls.length === 0) {
    throw new ApiError(400, 'itemId and a non-empty rolls[] array are required');
  }

  const item = await DeliveryItem.findById(itemId);
  if (!item) throw new ApiError(404, 'Delivery item not found');

  const job = await GodownJob.findOne({ items: item._id }).populate('dc').populate('godown');
  if (!job) throw new ApiError(404, 'No godown job found for this item');

  const sum = rolls.reduce((acc, r) => acc + Number(r.qty || 0), 0);
  if (sum !== item.qty && !override) {
    throw new ApiError(
      400,
      `Roll quantities (${sum}) do not match required quantity (${item.qty}). Provide override=true with a reason to proceed.`
    );
  }

  const existingCount = await Roll.countDocuments({ item: item._id });
  const created = [];
  for (let i = 0; i < rolls.length; i += 1) {
    const sequence = existingCount + i + 1;
    const roll = await Roll.create({
      rollId: buildRollId(job.dc.dcNumber, sequence),
      dc: job.dc._id,
      job: job._id,
      item: item._id,
      godown: job.godown._id,
      sequence,
      qty: rolls[i].qty,
      isOverride: sum !== item.qty,
      overrideReason: sum !== item.qty ? overrideReason || 'Quantity mismatch override' : undefined,
      createdBy: req.user?._id
    });
    created.push(roll);
  }

  if (job.status === 'PENDING' || job.status === 'PROCESSING' || job.status === 'RECEIVED') {
    job.status = 'PACKING';
    job.statusHistory.push({ status: 'PACKING', changedBy: req.user?._id, note: 'Rolls created' });
    await job.save();
  }

  await logAction({
    actor: req.user?._id,
    action: 'ROLLS_CREATED',
    entityType: 'DeliveryItem',
    entityId: item._id,
    details: { count: created.length, override: !!override },
    ip: req.ip
  });

  await notifyRoom(`godown:${job.godown.code}`, {
    type: 'ROLLS_CREATED',
    title: 'Rolls created',
    message: `${created.length} roll(s) created for ${item.itemName}`,
    payload: { jobId: job._id }
  });

  return ok(res, created, 'Rolls created', 201);
});

const listRollsForJob = asyncHandler(async (req, res) => {
  const rolls = await Roll.find({ job: req.params.jobId }).populate('item').sort({ sequence: 1 });
  return ok(res, rolls);
});

const markPacked = asyncHandler(async (req, res) => {
  const job = await GodownJob.findById(req.params.jobId).populate('godown').populate('dc');
  if (!job) throw new ApiError(404, 'Job not found');
  job.status = 'PACKED';
  job.statusHistory.push({ status: 'PACKED', changedBy: req.user?._id });
  await job.save();

  await notifyRoom(`godown:${job.godown.code}`, {
    type: 'JOB_STATUS',
    title: 'Job packed',
    message: `${job.dc.dcNumber} marked as PACKED`,
    payload: { jobId: job._id, status: 'PACKED' }
  });
  await notifyRoom('dispatch-office', {
    type: 'JOB_STATUS',
    title: 'Job packed',
    message: `${job.dc.dcNumber} (${job.godown.code}) is packed and ready for QR`,
    payload: { jobId: job._id, status: 'PACKED' }
  });

  return ok(res, job);
});

module.exports = { createRolls, listRollsForJob, markPacked };
