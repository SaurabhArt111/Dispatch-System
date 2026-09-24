/**
 * Core ingestion pipeline: takes a raw DC payload (from webhook, poll, or mock)
 * and turns it into DeliveryChallan + DeliveryItem + GodownJob records.
 *
 * Golden rule: System 1's sourceId is the deduplication key. If a DC with that
 * sourceId already exists, we NEVER touch it or its operational data again.
 */
const DeliveryChallan = require('../models/DeliveryChallan');
const DeliveryItem = require('../models/DeliveryItem');
const GodownJob = require('../models/GodownJob');
const Godown = require('../models/Godown');
const SyncLog = require('../models/SyncLog');
const { notifyRoom } = require('./notificationService');

async function ensureGodown(code) {
  const upper = String(code).toUpperCase().trim();
  let godown = await Godown.findOne({ code: upper });
  if (!godown) {
    godown = await Godown.create({ code: upper, name: `Godown ${upper}` });
  }
  return godown;
}

async function ingestDC(payload, { method = 'MOCK' } = {}) {
  const existing = await DeliveryChallan.findOne({ sourceId: payload.sourceId });
  if (existing) {
    await SyncLog.create({
      method,
      status: 'SKIPPED_DUPLICATE',
      sourceId: payload.sourceId,
      dcNumber: payload.dcNumber,
      message: 'DC already imported, skipped to protect operational data',
      payload
    });
    return { dc: existing, created: false };
  }

  const dc = await DeliveryChallan.create({
    sourceId: payload.sourceId,
    dcNumber: payload.dcNumber,
    dcDate: payload.dcDate ? new Date(payload.dcDate) : new Date(),
    billTo: payload.billTo,
    billAddress: payload.billAddress,
    billGSTIN: payload.billGSTIN,
    deliveryType: payload.deliveryType || 'COMPANY_VEHICLE',
    mistry: payload.mistry || '',
    raw: payload
  });

  // Group items by godown so one DC can fan out into multiple Godown Jobs
  const itemsByGodown = new Map();
  for (const raw of payload.items || []) {
    const godown = await ensureGodown(raw.godown);
    const item = await DeliveryItem.create({
      dc: dc._id,
      screenName: raw.screenName || '',
      itemName: raw.itemName,
      qty: raw.qty,
      godown: godown._id
    });
    const key = godown._id.toString();
    if (!itemsByGodown.has(key)) itemsByGodown.set(key, { godown, items: [] });
    itemsByGodown.get(key).items.push(item);
  }

  const jobs = [];
  for (const { godown, items } of itemsByGodown.values()) {
    const job = await GodownJob.create({
      dc: dc._id,
      godown: godown._id,
      items: items.map((i) => i._id),
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', note: 'Created from System 1 sync' }],
      isNew_: true
    });
    jobs.push(job);

    // Real-time push to the relevant godown TV / operators
    await notifyRoom(`godown:${godown.code}`, {
      type: 'NEW_DC',
      title: 'NEW DELIVERY CHALLAN',
      message: `${dc.dcNumber} — ${dc.billTo}`,
      payload: {
        jobId: job._id,
        dcId: dc._id,
        dcNumber: dc.dcNumber,
        billTo: dc.billTo,
        godownCode: godown.code,
        items: items.map((i) => ({ itemName: i.itemName, qty: i.qty }))
      }
    });
  }

  await notifyRoom('dispatch-office', {
    type: 'NEW_DC',
    title: 'New DC synced',
    message: `${dc.dcNumber} — ${dc.billTo}`,
    payload: { dcId: dc._id, dcNumber: dc.dcNumber }
  });

  await SyncLog.create({
    method,
    status: 'SUCCESS',
    sourceId: dc.sourceId,
    dcNumber: dc.dcNumber,
    message: `Imported with ${jobs.length} godown job(s)`,
    payload
  });

  return { dc, jobs, created: true };
}

module.exports = { ingestDC, ensureGodown };
