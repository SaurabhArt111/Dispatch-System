const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    dc: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    expectedRolls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Roll', required: true }],
    loadedRolls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Roll' }],
    status: {
      type: String,
      enum: ['LOADING', 'LOADED', 'DISPATCHED', 'CANCELLED'],
      default: 'LOADING'
    },
    loadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loadedAt: { type: Date },
    dispatchedAt: { type: Date },
    note: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispatch', dispatchSchema);
