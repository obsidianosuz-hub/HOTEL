const prisma = require('./src/utils/prismaClient');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. ROLLAR
  const roleDescriptions = {
    Admin: 'Full access to every module and system setting',
    Manager: 'Bookings, staff performance, channel analytics and rates',
    Reception: 'Check-in/out, bookings and payments',
    Housekeeping: 'Room cleaning tasks and lost & found',
    HousekeepingSupervisor: 'Oversees housekeeping tasks and staff',
    Bellboy: 'Guest requests, luggage and escort tasks',
    Procurement: 'Vendors, inventory and purchase orders'
  };
  const createdRoles = {};

  for (const [name, description] of Object.entries(roleDescriptions)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description },
      create: { name, description }
    });
    createdRoles[name] = role;
    console.log(`  ✅ Role: ${name} (id: ${role.id})`);
  }

  // 2. FOYDALANUVCHILAR (test uchun)
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { full_name: 'Admin User', email: 'admin@hotel.com', role: 'Admin' },
    { full_name: 'Manager User', email: 'manager@hotel.com', role: 'Manager' },
    { full_name: 'Reception User', email: 'reception@hotel.com', role: 'Reception' },
    { full_name: 'Housekeeping User', email: 'housekeeping@hotel.com', role: 'Housekeeping' },
    { full_name: 'Bellboy User', email: 'bellboy@hotel.com', role: 'Bellboy' },
    { full_name: 'Procurement User', email: 'procurement@hotel.com', role: 'Procurement' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        full_name: u.full_name,
        email: u.email,
        password_hash: passwordHash,
        role_id: createdRoles[u.role].id,
        status: 'Active'
      }
    });
    console.log(`  ✅ User: ${u.email} / password123 (${u.role})`);
  }

  // 3. XONA TURLARI
  const roomTypes = [
    { name: 'Standard', base_price: 500000, capacity: 2 },
    { name: 'Deluxe', base_price: 900000, capacity: 3 },
    { name: 'Suite', base_price: 1500000, capacity: 4 },
  ];

  const createdTypes = {};
  for (const rt of roomTypes) {
    const type = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: rt
    });
    createdTypes[rt.name] = type;
    console.log(`  ✅ Room Type: ${rt.name} (${rt.base_price} UZS)`);
  }

  // 4. XONALAR
  const rooms = [
    { room_number: '101', floor: 1, type: 'Standard' },
    { room_number: '102', floor: 1, type: 'Standard' },
    { room_number: '103', floor: 1, type: 'Standard' },
    { room_number: '104', floor: 1, type: 'Standard' },
    { room_number: '105', floor: 1, type: 'Deluxe' },
    { room_number: '201', floor: 2, type: 'Deluxe' },
    { room_number: '202', floor: 2, type: 'Deluxe' },
    { room_number: '203', floor: 2, type: 'Suite' },
    { room_number: '204', floor: 2, type: 'Suite' },
    { room_number: '301', floor: 3, type: 'Standard' },
    { room_number: '302', floor: 3, type: 'Deluxe' },
    { room_number: '303', floor: 3, type: 'Suite' },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { room_number: r.room_number },
      update: {},
      create: {
        room_number: r.room_number,
        floor: r.floor,
        room_type_id: createdTypes[r.type].id,
        reception_status: 'Available',
        housekeeping_status: 'Clean'
      }
    });
  }
  console.log(`  ✅ ${rooms.length} rooms created`);

  // 5. PERMISSIONS (Permission modeli: role_id, module, can_view, can_create, can_edit, can_delete)
  const adminMods = ['dashboard', 'users', 'roles', 'settings', 'audit-logs', 'system', 'integrations'];
  const managerMods = ['dashboard', 'analytics', 'staff', 'bookings', 'maintenance', 'rates'];
  const receptionMods = ['dashboard', 'bookings', 'rooms', 'payments'];
  const housekeepingMods = ['dashboard', 'tasks', 'rooms', 'lost-items', 'maintenance'];
  const bellboyMods = ['dashboard', 'tasks', 'luggage', 'guest-requests'];
  const procurementMods = ['dashboard', 'inventory', 'vendors', 'purchase-orders', 'supply-requests'];

  const allModules = Array.from(new Set([...adminMods, ...managerMods, ...receptionMods, ...housekeepingMods, ...bellboyMods, ...procurementMods]));

  // Admin — barcha modullarga to'liq ruxsat
  for (const mod of allModules) {
    await prisma.permission.create({
      data: { role_id: createdRoles['Admin'].id, module: mod, can_view: true, can_create: true, can_edit: true, can_delete: true }
    });
  }
  console.log('  ✅ Admin permissions (full access)');

  // Boshqa rollar — o'z modullari
  const roleModuleMap = {
    'Reception': receptionMods,
    'Manager': managerMods,
    'Housekeeping': housekeepingMods,
    'HousekeepingSupervisor': housekeepingMods,
    'Bellboy': bellboyMods,
    'Procurement': procurementMods,
  };

  for (const [roleName, mods] of Object.entries(roleModuleMap)) {
    for (const mod of mods) {
      await prisma.permission.create({
        data: { role_id: createdRoles[roleName].id, module: mod, can_view: true, can_create: true, can_edit: true, can_delete: false }
      });
    }
    console.log(`  ✅ ${roleName} permissions`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials (parol barchasi uchun: password123):');
  console.log('  admin@hotel.com       → Admin');
  console.log('  manager@hotel.com     → Manager');
  console.log('  reception@hotel.com   → Reception');
  console.log('  housekeeping@hotel.com→ Housekeeping');
  console.log('  bellboy@hotel.com     → Bellboy');
  console.log('  procurement@hotel.com → Procurement');

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
