const mongoose = require('mongoose');

const PERMISSIONS = [
  'dc:read', 'dc:manage',
  'godown:read', 'godown:manage',
  'job:read', 'job:manage',
  'packing:manage',
  'roll:manage',
  'qr:generate', 'qr:scan',
  'transfer:manage',
  'vehicle:manage',
  'dispatch:manage',
  'user:manage',
  'role:manage',
  'audit:read',
  'sync:read', 'sync:manage',
  'notification:read',
  'admin:all'
];

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'SUPER_ADMIN',
        'ADMIN',
        'DISPATCH_MANAGER',
        'DISPATCH_OPERATOR',
        'GODOWN_MANAGER',
        'GODOWN_OPERATOR',
        'VIEWER',
        'GODOWN_SCREEN'
      ]
    },
    label: { type: String, required: true },
    permissions: [{ type: String, enum: PERMISSIONS }],
    isSystem: { type: Boolean, default: true }
  },
  { timestamps: true }
);

roleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('Role', roleSchema);
