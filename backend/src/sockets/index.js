const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GodownScreen = require('../models/GodownScreen');
const { attachIo } = require('../services/notificationService');

function initSockets(io) {
  attachIo(io);

  io.use(async (socket, next) => {
    try {
      const { token, tokenType } = socket.handshake.auth || {};
      if (!token) return next(new Error('No auth token'));

      if (tokenType === 'screen') {
        const payload = jwt.verify(token, process.env.SCREEN_PAIRING_SECRET);
        const screen = await GodownScreen.findById(payload.screenId).populate('godown');
        if (!screen || !screen.isPaired) return next(new Error('Screen not paired'));
        socket.screen = screen;
        return next();
      }

      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub).populate('role').populate('assignedGodowns');
      if (!user || !user.isActive) return next(new Error('Invalid user'));
      socket.user = user;
      next();
    } catch (e) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.screen) {
      const room = `godown:${socket.screen.godown.code}`;
      socket.join(room);
      GodownScreen.findByIdAndUpdate(socket.screen._id, { isOnline: true, lastSeenAt: new Date() }).catch(() => {});
      socket.on('disconnect', () => {
        GodownScreen.findByIdAndUpdate(socket.screen._id, { isOnline: false }).catch(() => {});
      });
    } else if (socket.user) {
      const perms = socket.user.role?.permissions || [];
      // Every authenticated user gets their assigned godown rooms
      (socket.user.assignedGodowns || []).forEach((g) => socket.join(`godown:${g.code}`));
      if (perms.includes('admin:all') || perms.includes('dispatch:manage') || perms.includes('job:read')) {
        socket.join('dispatch-office');
      }
      if (perms.includes('admin:all')) socket.join('admin');

      socket.on('join-godown', (code) => {
        const allowed =
          perms.includes('admin:all') ||
          perms.includes('godown:manage') ||
          (socket.user.assignedGodowns || []).some((g) => g.code === code);
        if (allowed) socket.join(`godown:${code}`);
      });
    }
  });
}

module.exports = initSockets;
