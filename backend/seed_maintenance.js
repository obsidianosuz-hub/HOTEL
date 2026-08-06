const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMaintenance() {
  try {
    // Get Usta user
    const usta = await prisma.user.findFirst({
      where: { full_name: 'Ulug Usta', role: { name: 'Usta' } }
    });

    if (!usta) {
      console.log('Usta topilmadi');
      return;
    }

    // Get Housekeeper user to act as reporter
    const housekeeper = await prisma.user.findFirst({
      where: { role: { name: 'Housekeeping' } }
    });

    // Get some rooms
    const rooms = await prisma.room.findMany({ take: 3 });

    if (rooms.length < 3 || !housekeeper) {
      console.log('Kerakli malumotlar topilmadi (Xona yoki Housekeeper)');
      return;
    }

    // Insert example maintenance tasks
    await prisma.maintenanceRequest.create({
      data: {
        room_id: rooms[0].id,
        reported_by_user_id: housekeeper.id,
        description: 'Konditsioner yaxshi sovitmayapti. Filtrlarni tozalash yoki freon quyish kerak.',
        status: 'New',
        assigned_to: usta.full_name
      }
    });

    await prisma.maintenanceRequest.create({
      data: {
        room_id: rooms[1].id,
        reported_by_user_id: housekeeper.id,
        description: 'Vannaxona krani oqib qolibdi, rezinkasini almashtirish zarur.',
        status: 'InProgress',
        assigned_to: usta.full_name
      }
    });

    await prisma.maintenanceRequest.create({
      data: {
        room_id: rooms[2].id,
        reported_by_user_id: housekeeper.id,
        description: 'Televizor pulti ishlamayapti, yangi batareyka qoyish yoki almashtirish kerak.',
        status: 'New',
        assigned_to: usta.full_name
      }
    });

    console.log('Ustaga misol vazifalar muvaffaqiyatli yuborildi!');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMaintenance();
