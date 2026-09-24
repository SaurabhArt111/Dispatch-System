const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const GodownJob = require('../models/GodownJob');
const Godown = require('../models/Godown');
const { logAction } = require('../services/auditService');
const { notifyRoom } = require('../services/notificationService');

const listJobsForGodown = asyncHandler(async (req, res) => {
  const godown = await Godown.findOne({ code: req.params.godownCode.toUpperCase() });
  if (!godown) throw new ApiError(404, 'Godown not found');
  const jobs = await GodownJob.find({ godown: godown._id })
    .populate('dc')
    .populate('items')
    .sort({ createdAt: -1 });
  return ok(res, { godown, jobs });
});

const listAllJobs = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const jobs = await GodownJob.find(query).populate('dc').populate('godown').populate('items').sort({ createdAt: -1 }).limit(200);
  return ok(res, jobs);
});

const acknowledgeJob = asyncHandler(async (req, res) => {
  const job = await GodownJob.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  job.isNew_ = false;
  await job.save();
  return ok(res, job);
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!GodownJob.STATUSES.includes(status)) throw new ApiError(400, 'Invalid status');

  const job = await GodownJob.findById(req.params.id).populate('godown').populate('dc');
  if (!job) throw new ApiError(404, 'Job not found');

  job.status = status;
  job.isNew_ = false;
  job.statusHistory.push({ status, changedBy: req.user?._id, note });
  await job.save();

  await logAction({
    actor: req.user?._id,
    action: 'JOB_STATUS_UPDATED',
    entityType: 'GodownJob',
    entityId: job._id,
    details: { status, note },
    ip: req.ip
  });

  await notifyRoom(`godown:${job.godown.code}`, {
    type: 'JOB_STATUS',
    title: 'Job status updated',
    message: `${job.dc.dcNumber} is now ${status.replace(/_/g, ' ')}`,
    payload: { jobId: job._id, status }
  });
  await notifyRoom('dispatch-office', {
    type: 'JOB_STATUS',
    title: 'Job status updated',
    message: `${job.dc.dcNumber} (${job.godown.code}) is now ${status.replace(/_/g, ' ')}`,
    payload: { jobId: job._id, status }
  });

  return ok(res, job);
});

const listJobsForScreen = asyncHandler(async (req, res) => {
  const jobs = await GodownJob.find({ godown: req.screen.godown._id })
    .populate('dc')
    .populate('items')
    .sort({ createdAt: -1 })
    .limit(100);
  return ok(res, { godown: req.screen.godown, jobs });
});

module.exports = { listJobsForGodown, listAllJobs, acknowledgeJob, updateJobStatus, listJobsForScreen };
