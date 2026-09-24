const Notification = require('../models/Notification');

let ioInstance = null;
function attachIo(io) {
  ioInstance = io;
}

async function notifyRoom(room, { type, title, message, payload, targetUsers }) {
  const notification = await Notification.create({ type, title, message, room, payload, targetUsers });
  if (ioInstance) {
    ioInstance.to(room).emit('notification', {
      id: notification._id,
      type,
      title,
      message,
      payload,
      createdAt: notification.createdAt
    });
  }
  return notification;
}

module.exports = { attachIo, notifyRoom };
