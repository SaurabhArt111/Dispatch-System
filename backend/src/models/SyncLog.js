const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema(
  {
    source: { type: String, default: 'SYSTEM1' },
    method: { type: String, enum: ['WEBHOOK', 'POLL', 'MANUAL', 'MOCK'], default: 'MOCK' },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED_DUPLICATE'], required: true },
    sourceId: { type: String },
    dcNumber: { type: String },
    message: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SyncLog', syncLogSchema);
