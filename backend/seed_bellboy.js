const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Bellboy data...');

  // 1. Get a guest
  let guest = await prisma.guest.findFirst();
  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        full_name: 'John Doe',
        phone: '+998901234567',
        email: 'john@example.com'
      }
    });
  }

  // 2. Get a room
  let room = await prisma.room.findFirst();
  if (!room) {
    const type = await prisma.roomType.findFirst();
    room = await prisma.room.create({
      data: {
        room_number: '101',
        floor: 1,
        room_type_id: type.id
      }
    });
  }

  // 3. Get bellboy user
  const bellboy = await prisma.user.findFirst({
    where: { role: { name: 'Bellboy' } }
  });

  if (!bellboy) {
    console.error('No Bellboy user found!');
    return;
  }

  // Insert Guest Requests
  await prisma.guestRequest.createMany({
    data: [
      { guest_id: guest.id, room_id: room.id, request_type: 'Extra Towels', status: 'Pending' },
      { guest_id: guest.id, room_id: room.id, request_type: 'Taxi Booking', status: 'Pending' },
      { guest_id: guest.id, room_id: room.id, request_type: 'Wake up call', status: 'Accepted' },
    ]
  });

  // Insert Luggage
  await prisma.luggageItem.createMany({
    data: [
      { tag_id: 'LTG-2026-0001', guest_id: guest.id, description: '2x Black Suitcases', status: 'Stored' },
      { tag_id: 'LTG-2026-0002', guest_id: guest.id, description: '1x Backpack, 1x Box', status: 'Stored' },
      { tag_id: 'LTG-2026-0003', guest_id: guest.id, description: 'Golf Clubs', status: 'Delivered' }
    ]
  });

  // Insert Tasks
  await prisma.bellboyTask.createMany({
    data: [
      { guest_id: guest.id, room_id: room.id, task_type: 'Luggage', priority: 'High', status: 'Assigned', assigned_to_user_id: bellboy.id },
      { guest_id: guest.id, room_id: room.id, task_type: 'Escort', priority: 'Normal', status: 'Assigned', assigned_to_user_id: bellboy.id },
      { guest_id: guest.id, room_id: room.id, task_type: 'Other', priority: 'Urgent', status: 'InProgress', assigned_to_user_id: bellboy.id, started_at: new Date() },
      { guest_id: guest.id, room_id: room.id, task_type: 'Luggage', priority: 'Normal', status: 'Completed', assigned_to_user_id: bellboy.id, started_at: new Date(Date.now() - 3600000), completed_at: new Date() }
    ]
  });

  console.log('Bellboy data seeded successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
