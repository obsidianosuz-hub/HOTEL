const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ROLE_PERMISSIONS = {
  Admin: [], // Admin bypasses RBAC entirely (see rbacMiddleware.js)
  Manager: ['dashboard', 'analytics', 'staff', 'bookings', 'lost-items', 'maintenance', 'rates'],
  Reception: ['dashboard', 'bookings', 'rooms', 'payments'],
  Housekeeping: ['dashboard', 'tasks', 'rooms', 'lost-items', 'Housekeeping'],
  Bellboy: ['dashboard', 'tasks', 'guest-requests', 'luggage'],
  Procurement: ['dashboard', 'vendors', 'purchase-orders', 'inventory', 'invoices', 'payments', 'reports']
};

const DEMO_USERS = [
  { full_name: 'Alice Admin', email: 'admin@hotel.com', role: 'Admin' },
  { full_name: 'Mark Manager', email: 'manager@hotel.com', role: 'Manager' },
  { full_name: 'Rita Reception', email: 'reception@hotel.com', role: 'Reception' },
  { full_name: 'Helen Housekeeper', email: 'housekeeping@hotel.com', role: 'Housekeeping' },
  { full_name: 'Bob Bellboy', email: 'bellboy@hotel.com', role: 'Bellboy' },
  { full_name: 'Pete Procurement', email: 'procurement@hotel.com', role: 'Procurement' }
];

const DEMO_PASSWORD = 'Password123!';

async function main() {
  console.log('Seeding roles & permissions...');
  const roleMap = {};

  for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` }
    });
    roleMap[roleName] = role;

    // Full access on every module this role's routes check
    for (const module of ROLE_PERMISSIONS[roleName]) {
      const existing = await prisma.permission.findFirst({ where: { role_id: role.id, module } });
      if (!existing) {
        await prisma.permission.create({
          data: { role_id: role.id, module, can_view: true, can_create: true, can_edit: true, can_delete: true }
        });
      }
    }
  }

  console.log('Seeding demo users...');
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        full_name: u.full_name,
        email: u.email,
        password_hash,
        role_id: roleMap[u.role].id,
        status: 'Active'
      }
    });
  }

  console.log('Seeding room types & rooms...');
  const roomTypes = [
    { name: 'Standard', base_price: 60, capacity: 2, description: 'Cozy standard room' },
    { name: 'Deluxe', base_price: 95, capacity: 2, description: 'Spacious deluxe room' },
    { name: 'Suite', base_price: 150, capacity: 4, description: 'Luxury suite' }
  ];
  const roomTypeMap = {};
  for (const rt of roomTypes) {
    const created = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: rt
    });
    roomTypeMap[rt.name] = created;
  }

  const rooms = [
    { room_number: '101', floor: 1, type: 'Standard' },
    { room_number: '102', floor: 1, type: 'Standard' },
    { room_number: '201', floor: 2, type: 'Deluxe' },
    { room_number: '202', floor: 2, type: 'Deluxe' },
    { room_number: '301', floor: 3, type: 'Suite' }
  ];
  for (const r of rooms) {
    await prisma.room.upsert({
      where: { room_number: r.room_number },
      update: {},
      create: { room_number: r.room_number, floor: r.floor, room_type_id: roomTypeMap[r.type].id }
    });
  }

  console.log('\nDone. Demo login credentials (password for all: ' + DEMO_PASSWORD + '):');
  DEMO_USERS.forEach(u => console.log(`  ${u.role.padEnd(14)} ${u.email}`));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
