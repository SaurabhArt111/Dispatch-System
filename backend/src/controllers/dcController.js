const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const DeliveryChallan = require('../models/DeliveryChallan');
const DeliveryItem = require('../models/DeliveryItem');
const GodownJob = require('../models/GodownJob');

const listDCs = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { dcNumber: new RegExp(search, 'i') },
      { billTo: new RegExp(search, 'i') }
    ];
  }
  const dcs = await DeliveryChallan.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await DeliveryChallan.countDocuments(query);
  return ok(res, { dcs, total, page: Number(page), limit: Number(limit) });
});

const getDC = asyncHandler(async (req, res) => {
  const dc = await DeliveryChallan.findById(req.params.id);
  const items = await DeliveryItem.find({ dc: dc._id }).populate('godown');
  const jobs = await GodownJob.find({ dc: dc._id }).populate('godown').populate('items');
  return ok(res, { dc, items, jobs });
});

module.exports = { listDCs, getDC };
