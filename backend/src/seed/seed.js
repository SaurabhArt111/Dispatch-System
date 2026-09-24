require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Role = require('../models/Role');
const User = require('../models/User');
const Godown = require('../models/Godown');
const Vehicle = require('../models/Vehicle');
const { ingestDC } = require('../services/dcIngestService');
const mockSystem1 = require('../services/mockSystem1');

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    permissions: ['admin:all']
  },
  {
    name: 'ADMIN',
    label: 'Admin',
    permissions: [
      'dc:read', 'godown:read', 'godown:manage', 'job:read', 'job:manage',
      'packing:manage', 'roll:manage', 'qr:generate', 'qr:scan', 'transfer:manage',
      'vehicle:manage', 'dispatch:manage', 'user:manage', 'role:manage',
      'audit:read', 'sync:read', 'sync:manage', 'notification:read'
    ]
  },
  {
    name: 'DISPATCH_MANAGER',
    label: 'Dispatch Manager',
    permissions: [
      'dc:read', 'godown:read', 'job:read', 'job:manage', 'packing:manage', 'roll:manage',
      'qr:generate', 'qr:scan', 'transfer:manage', 'vehicle:manage', 'dispatch:manage',
      'sync:read', 'notification:read'
    ]
  },
  {
    name: 'DISPATCH_OPERATOR',
    label: 'Dispatch Operator',
    permissions: ['dc:read', 'godown:read', 'job:read', 'qr:generate', 'qr:scan', 'dispatch:manage', 'notification:read']
  },
  {
    name: 'GODOWN_MANAGER',
    label: 'Godown Manager',
    permissions: ['dc:read', 'godown:read', 'job:read', 'job:manage', 'packing:manage', 'roll:manage', 'transfer:manage', 'notification:read']
  },
  {
    name: 'GODOWN_OPERATOR',
    label: 'Godown Operator',
    permissions: ['dc:read', 'godown:read', 'job:read', 'packing:manage', 'roll:manage', 'notification:read']
  },
  {
    name: 'VIEWER',
    label: 'Viewer',
    permissions: ['dc:read', 'godown:read', 'job:read', 'notification:read']
  },
  {
    name: 'GODOWN_SCREEN',
    label: 'Godown Screen (TV device)',
    permissions: ['job:read']
  }
];

const GODOWNS = [
  { code: 'S-28', name: 'Godown S-28 - Laminates', location: 'Zone A' },
  { code: 'S-17', name: 'Godown S-17 - Veneers', location: 'Zone B' },
  { code: 'S-04', name: 'Godown S-04 - Hardware', location: 'Zone C' }
];

async function run() {
  await connectDB();
  console.log('Seeding database...');

  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    Godown.deleteMany({}),
    Vehicle.deleteMany({}),
    mongoose.connection.collection('deliverychallans').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('deliveryitems').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('godownjobs').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('rolls').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('qrcodes').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('synclogs').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('auditlogs').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('notifications').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('sessions').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('transfers').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('dispatches').deleteMany({}).catch(() => {}),
    mongoose.connection.collection('godownscreens').deleteMany({}).catch(() => {})
  ]);

  const roles = await Role.insertMany(ROLES);
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  const godowns = await Godown.insertMany(GODOWNS);

  const pass = await bcrypt.hash('Password@123', 10);

  const users = await User.insertMany([
    { name: 'Aarav Shah (Super Admin)', email: 'superadmin@dispatch.local', passwordHash: pass, role: roleByName.SUPER_ADMIN._id, avatarColor: '#4F6BFE' },
    { name: 'Neha Patel (Admin)', email: 'admin@dispatch.local', passwordHash: pass, role: roleByName.ADMIN._id, avatarColor: '#8B5CF6' },
    { name: 'Karan Mehta (Dispatch Manager)', email: 'dispatch.manager@dispatch.local', passwordHash: pass, role: roleByName.DISPATCH_MANAGER._id, avatarColor: '#F59E0B' },
    { name: 'Priya Desai (Dispatch Operator)', email: 'dispatch.operator@dispatch.local', passwordHash: pass, role: roleByName.DISPATCH_OPERATOR._id, avatarColor: '#EF4444' },
    {
      name: 'Vikram Rao (Godown Manager S-28)',
      email: 'godown.manager@dispatch.local',
      passwordHash: pass,
      role: roleByName.GODOWN_MANAGER._id,
      assignedGodowns: [godowns[0]._id],
      avatarColor: '#10B981'
    },
    {
      name: 'Ritu Nair (Godown Operator S-17)',
      email: 'godown.operator@dispatch.local',
      passwordHash: pass,
      role: roleByName.GODOWN_OPERATOR._id,
      assignedGodowns: [godowns[1]._id],
      avatarColor: '#06B6D4'
    },
    { name: 'Sanjay Iyer (Viewer)', email: 'viewer@dispatch.local', passwordHash: pass, role: roleByName.VIEWER._id, avatarColor: '#64748B' }
  ]);

  await Vehicle.insertMany([
    { type: 'COMPANY_VEHICLE', vehicleNumber: 'GJ-05-AB-1234', driverName: 'Bharat Solanki', driverMobile: '9825012345' },
    { type: 'COMPANY_VEHICLE', vehicleNumber: 'GJ-05-CD-5678', driverName: 'Manoj Vaghela', driverMobile: '9825067890' },
    { type: 'PARTY_VEHICLE', vehicleNumber: 'GJ-06-XY-9988', driverName: 'Ashok Chauhan', driverMobile: '9909988776' }
  ]);

  // Seed a batch of realistic DCs flowing through the ingestion pipeline (dedupe-safe)
  for (let i = 0; i < 10; i += 1) {
    const payload = mockSystem1.generateMockDC();
    // eslint-disable-next-line no-await-in-loop
    await ingestDC(payload, { method: 'MOCK' });
  }

  console.log('Seed complete.');
  console.log('');
  console.log('Demo credentials (password for all: Password@123):');
  users.forEach((u) => console.log(`  - ${u.email}`));
  console.log('');
  console.log(`Godowns: ${godowns.map((g) => g.code).join(', ')}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
