const mongoose = require('mongoose');

const STATUSES = [
  'PENDING', 'PROCESSING', 'ON_HOLD', 'TRANSFER_REQUESTED',
  'TRANSFERRED', 'RECEIVED', 'PACKING', 'PACKED', 'READY_FOR_DISPATCH'
];

const godownJobSchema = new mongoose.Schema(
  {
    dc: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan', required: true, index: true },
    godown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryItem' }],
    status: { type: String, enum: STATUSES, default: 'PENDING', index: true },
    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String
      }
    ],
    isNew_: { type: Boolean, default: true }
  },
  { timestamps: true }
);

godownJobSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('GodownJob', godownJobSchema);
