const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const Transfer = require('../models/Transfer');
const GodownJob = require('../models/GodownJob');
const Godown = require('../models/Godown');
const { notifyRoom } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

const requestTransfer = asyncHandler(async (req, res) => {
  const { jobId, toGodownCode, note } = req.body;
  const job = await GodownJob.findById(jobId).populate('godown').populate('dc');
  if (!job) throw new ApiError(404, 'Job not found');

  const toGodown = await Godown.findOne({ code: toGodownCode.toUpperCase() });
  if (!toGodown) throw new ApiError(404, 'Destination godown not found');

  const transfer = await Transfer.create({
    job: job._id,
    fromGodown: job.godown._id,
    toGodown: toGodown._id,
    requestedBy: req.user._id,
    note
  });

  job.status = 'TRANSFER_REQUESTED';
  job.statusHistory.push({ status: 'TRANSFER_REQUESTED', changedBy: req.user._id, note });
  await job.save();

  await notifyRoom(`godown:${toGodown.code}`, {
    type: 'TRANSFER_REQUESTED',
    title: 'Incoming transfer requested',
    message: `${job.dc.dcNumber} is being transferred from ${job.godown.code}`,
    payload: { transferId: transfer._id, jobId: job._id }
  });

  await logAction({ actor: req.user._id, action: 'TRANSFER_REQUESTED', entityType: 'Transfer', entityId: transfer._id, ip: req.ip });

  return ok(res, transfer, 'Transfer requested', 201);
});

const markTransferred = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id).populate('job').populate('fromGodown').populate('toGodown');
  if (!transfer) throw new ApiError(404, 'Transfer not found');

  transfer.status = 'TRANSFERRED';
  transfer.transferredAt = new Date();
  await transfer.save();

  const job = await GodownJob.findById(transfer.job._id);
  job.status = 'TRANSFERRED';
  job.statusHistory.push({ status: 'TRANSFERRED', changedBy: req.user._id });
  await job.save();

  await notifyRoom(`godown:${transfer.toGodown.code}`, {
    type: 'TRANSFER_UPDATE',
    title: 'Transfer dispatched to you',
    message: `Please confirm receipt for job ${transfer.job._id}`,
    payload: { transferId: transfer._id }
  });

  return ok(res, transfer, 'Transfer marked as transferred');
});

const confirmReceipt = asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id).populate('job').populate('toGodown');
  if (!transfer) throw new ApiError(404, 'Transfer not found');

  transfer.status = 'RECEIVED';
  transfer.receivedBy = req.user._id;
  transfer.receivedAt = new Date();
  await transfer.save();

  const job = await GodownJob.findById(transfer.job._id);
  job.godown = transfer.toGodown._id;
  job.status = 'RECEIVED';
  job.statusHistory.push({ status: 'RECEIVED', changedBy: req.user._id, note: 'Receipt confirmed after transfer' });
  await job.save();

  await logAction({ actor: req.user._id, action: 'TRANSFER_RECEIVED', entityType: 'Transfer', entityId: transfer._id, ip: req.ip });

  return ok(res, transfer, 'Receipt confirmed');
});

const listTransfers = asyncHandler(async (req, res) => {
  const transfers = await Transfer.find()
    .populate('job')
    .populate('fromGodown')
    .populate('toGodown')
    .sort({ createdAt: -1 });
  return ok(res, transfers);
});

module.exports = { requestTransfer, markTransferred, confirmReceipt, listTransfers };
