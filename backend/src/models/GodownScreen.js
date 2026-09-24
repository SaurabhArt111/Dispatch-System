const mongoose = require('mongoose');

const godownScreenSchema = new mongoose.Schema(
  {
    godown: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    deviceLabel: { type: String, default: 'Main TV' },
    pairingCode: { type: String, required: true, unique: true },
    pairingToken: { type: String },
    isPaired: { type: Boolean, default: false },
    lastSeenAt: { type: Date },
    isOnline: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GodownScreen', godownScreenSchema);
