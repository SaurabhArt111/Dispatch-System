const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/apiResponse');
const User = require('../models/User');
const Session = require('../models/Session');
const { logAction } = require('../services/auditService');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueRefreshToken(user, req) {
  const refreshToken = jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d'
  });
  const decoded = jwt.decode(refreshToken);
  await Session.create({
    user: user._id,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: new Date(decoded.exp * 1000)
  });
  return refreshToken;
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).populate('role').populate('assignedGodowns');
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled by an administrator');

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new ApiError(401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user, req);

  await logAction({ actor: user._id, action: 'LOGIN', entityType: 'User', entityId: user._id, ip: req.ip });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  return ok(res, {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  }, 'Logged in');
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return ok(res, null, 'No active session');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new ApiError(401, 'Refresh token invalid or expired');
  }

  const session = await Session.findOne({ user: payload.sub, refreshTokenHash: hashToken(token) });
  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    throw new ApiError(401, 'Session revoked or expired, please log in again');
  }

  const user = await User.findById(payload.sub).populate('role').populate('assignedGodowns');
  if (!user || !user.isActive) throw new ApiError(401, 'Account disabled');

  const accessToken = signAccessToken(user);
  return ok(res, { accessToken, user: sanitizeUser(user) }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await Session.updateOne({ user: payload.sub, refreshTokenHash: hashToken(token) }, { isRevoked: true });
    } catch (e) {
      // token already invalid, nothing to revoke
    }
  }
  res.clearCookie('refreshToken');
  return ok(res, null, 'Logged out');
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { user: sanitizeUser(req.user) });
});

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role ? { id: user.role._id, name: user.role.name, label: user.role.label, permissions: user.role.permissions } : null,
    assignedGodowns: (user.assignedGodowns || []).map((g) => ({ id: g._id, code: g.code, name: g.name })),
    avatarColor: user.avatarColor,
    lastLoginAt: user.lastLoginAt
  };
}

module.exports = { login, refresh, logout, me, sanitizeUser, hashToken };
