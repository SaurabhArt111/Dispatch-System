const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PARTY_VEHICLE', 'COMPANY_VEHICLE'], required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverMobile: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
