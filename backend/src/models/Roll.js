const mongoose = require('mongoose');

const rollSchema = new mongoose.Schema(
  {
    rollId: { type: String, required: true, unique: true },
    dc: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'GodownJob', required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryItem', required: true },
    godown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    sequence: { type: Number, required: true },
    qty: { type: Number, required: true },
    isOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['CREATED', 'QR_GENERATED', 'SCANNED', 'LOADED', 'DISPATCHED'],
      default: 'CREATED'
    },
    scannedAt: { type: Date },
    loadedAt: { type: Date },
    dispatchedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roll', rollSchema);
