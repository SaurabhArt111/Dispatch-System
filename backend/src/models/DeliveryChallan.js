const mongoose = require('mongoose');

const deliveryChallanSchema = new mongoose.Schema(
  {
    sourceId: { type: String, required: true, unique: true, index: true },
    dcNumber: { type: String, required: true, index: true },
    dcDate: { type: Date, required: true },
    billTo: { type: String, required: true },
    billAddress: { type: String },
    billGSTIN: { type: String },
    deliveryType: { type: String, enum: ['PARTY_VEHICLE', 'COMPANY_VEHICLE'], required: true },
    mistry: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed },
    syncedAt: { type: Date, default: Date.now },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryChallan', deliveryChallanSchema);
