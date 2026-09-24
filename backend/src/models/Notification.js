const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String },
    room: { type: String, index: true },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    payload: { type: mongoose.Schema.Types.Mixed },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
