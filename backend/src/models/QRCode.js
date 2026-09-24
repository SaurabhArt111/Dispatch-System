const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    roll: { type: mongoose.Schema.Types.ObjectId, ref: 'Roll', required: true, unique: true },
    code: { type: String, required: true, unique: true },
    dataUrl: { type: String, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    printedCount: { type: Number, default: 0 },
    lastPrintedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('QRCode', qrCodeSchema);
