const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'GodownJob', required: true },
    fromGodown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    toGodown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    status: {
      type: String,
      enum: ['TRANSFER_REQUESTED', 'TRANSFERRED', 'RECEIVED', 'CANCELLED'],
      default: 'TRANSFER_REQUESTED'
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    transferredAt: { type: Date },
    receivedAt: { type: Date },
    note: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transfer', transferSchema);
