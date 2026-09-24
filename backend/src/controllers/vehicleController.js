const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const Vehicle = require('../models/Vehicle');
const { logAction } = require('../services/auditService');

const listVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find().sort({ createdAt: -1 });
  return ok(res, vehicles);
});

const createVehicle = asyncHandler(async (req, res) => {
  const { type, vehicleNumber, driverName, driverMobile } = req.body;
  if (!type || !vehicleNumber || !driverName || !driverMobile) {
    throw new ApiError(400, 'type, vehicleNumber, driverName, driverMobile are required');
  }
  const vehicle = await Vehicle.create({ type, vehicleNumber, driverName, driverMobile });
  await logAction({ actor: req.user._id, action: 'VEHICLE_CREATED', entityType: 'Vehicle', entityId: vehicle._id, ip: req.ip });
  return ok(res, vehicle, 'Vehicle added', 201);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  Object.assign(vehicle, req.body);
  await vehicle.save();
  return ok(res, vehicle, 'Vehicle updated');
});

module.exports = { listVehicles, createVehicle, updateVehicle };
