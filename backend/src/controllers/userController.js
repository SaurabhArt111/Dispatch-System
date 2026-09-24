const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const User = require('../models/User');
const Session = require('../models/Session');
const Role = require('../models/Role');
const { logAction } = require('../services/auditService');

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('role').populate('assignedGodowns').sort({ createdAt: -1 });
  return ok(res, users.map(pub));
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ name: 1 });
  return ok(res, roles);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, assignedGodowns = [] } = req.body;
  if (!name || !email || !password || !roleId) throw new ApiError(400, 'name, email, password, roleId are required');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'A user with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: roleId, assignedGodowns });
  await logAction({ actor: req.user._id, action: 'USER_CREATED', entityType: 'User', entityId: user._id, ip: req.ip });

  const populated = await user.populate(['role', 'assignedGodowns']);
  return ok(res, pub(populated), 'User created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, roleId, assignedGodowns, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name !== undefined) user.name = name;
  if (roleId !== undefined) user.role = roleId;
  if (assignedGodowns !== undefined) user.assignedGodowns = assignedGodowns;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  await logAction({
    actor: req.user._id,
    action: isActive === false ? 'USER_DISABLED' : 'USER_UPDATED',
    entityType: 'User',
    entityId: user._id,
    ip: req.ip
  });

  const populated = await user.populate(['role', 'assignedGodowns']);
  return ok(res, pub(populated), 'User updated');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  await logAction({ actor: req.user._id, action: 'PASSWORD_RESET', entityType: 'User', entityId: user._id, ip: req.ip });
  return ok(res, null, 'Password reset');
});

const forceLogout = asyncHandler(async (req, res) => {
  await Session.updateMany({ user: req.params.id, isRevoked: false }, { isRevoked: true });
  await logAction({ actor: req.user._id, action: 'FORCE_LOGOUT', entityType: 'User', entityId: req.params.id, ip: req.ip });
  return ok(res, null, 'All sessions revoked for user');
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.params.id }).sort({ createdAt: -1 });
  return ok(res, sessions);
});

const revokeSession = asyncHandler(async (req, res) => {
  await Session.updateOne({ _id: req.params.sessionId }, { isRevoked: true });
  await logAction({ actor: req.user._id, action: 'SESSION_REVOKED', entityType: 'Session', entityId: req.params.sessionId, ip: req.ip });
  return ok(res, null, 'Session revoked');
});

function pub(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role ? { id: user.role._id, name: user.role.name, label: user.role.label, permissions: user.role.permissions } : null,
    assignedGodowns: (user.assignedGodowns || []).map((g) => ({ id: g._id, code: g.code, name: g.name })),
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt
  };
}

module.exports = { listUsers, listRoles, createUser, updateUser, resetPassword, forceLogout, listSessions, revokeSession };
