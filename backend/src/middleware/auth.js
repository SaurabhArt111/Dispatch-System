const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Role = require('../models/Role');
const GodownScreen = require('../models/GodownScreen');

// Standard user auth: verifies short-lived access token from Authorization header
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new ApiError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (e) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub).populate('role').populate('assignedGodowns');
  if (!user || !user.isActive) throw new ApiError(401, 'Account disabled or not found');

  req.user = user;
  next();
});

// Alternative auth path for permanently-running Godown TVs, paired once via pairing code
const requireScreenAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Screen not paired');

  let payload;
  try {
    payload = jwt.verify(token, process.env.SCREEN_PAIRING_SECRET);
  } catch (e) {
    throw new ApiError(401, 'Invalid or expired screen token');
  }

  const screen = await GodownScreen.findById(payload.screenId).populate('godown');
  if (!screen || !screen.isPaired) throw new ApiError(401, 'Screen not paired');

  req.screen = screen;
  next();
});

function requirePermission(...perms) {
  return (req, res, next) => {
    const userPerms = req.user?.role?.permissions || [];
    if (userPerms.includes('admin:all')) return next();
    const hasAll = perms.every((p) => userPerms.includes(p));
    if (!hasAll) return next(new ApiError(403, 'You do not have permission to perform this action'));
    next();
  };
}

// Ensures a user with limited godown access can only touch their assigned godowns
function requireGodownAccess(paramName = 'godownCode') {
  return asyncHandler(async (req, res, next) => {
    const perms = req.user?.role?.permissions || [];
    if (perms.includes('admin:all') || perms.includes('godown:manage')) return next();

    const code = (req.params[paramName] || req.body.godownCode || '').toUpperCase();
    const allowed = (req.user.assignedGodowns || []).some((g) => g.code === code);
    if (!allowed) throw new ApiError(403, 'You do not have access to this godown');
    next();
  });
}

module.exports = { requireAuth, requireScreenAuth, requirePermission, requireGodownAccess };
