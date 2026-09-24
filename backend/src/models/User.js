const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    assignedGodowns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Godown' }],
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    avatarColor: { type: String, default: '#4F6BFE' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
