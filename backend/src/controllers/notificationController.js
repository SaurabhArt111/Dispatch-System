const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const Notification = require('../models/Notification');

const listForRoom = asyncHandler(async (req, res) => {
  const { room } = req.query;
  const query = room ? { room } : {};
  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
  return ok(res, notifications);
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id }, { $addToSet: { readBy: req.user._id } });
  return ok(res, null, 'Marked as read');
});

module.exports = { listForRoom, markRead };
