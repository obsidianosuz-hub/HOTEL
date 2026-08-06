const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedKitchenOrders() {
  try {
    // 1. Mehmonlardan birini va uning bronini/xonasini topish
    const guest = await prisma.guest.findFirst();
    const room = await prisma.room.findFirst();

    if (!guest || !room) {
      console.log('Mehmon yoki xona topilmadi');
      return;
    }

    // 2. Bir nechta ovqat buyurtmalarini (FoodOrder / RoomService) yaratish
    await prisma.guestRequest.create({
      data: {
        guest_id: guest.id,
        room_id: room.id,
        request_type: 'FoodOrder',
        status: 'Pending',
      }
    });

    // We can also append notes to the guestRequest by updating or using another table if they had notes, 
    // but looking at the schema, there is no 'notes' field in GuestRequest. Just 'request_type'.
    // Wait, let's check GuestRequest schema again: 
    // guest_id, room_id, request_type, status, created_at.
    // In oshpazController it just shows the request_type.
    // If the schema allows string request_type, we can just put the food name there for demo purposes.
    // e.g. request_type = "FoodOrder: 2x Palov, 1x Choy" - wait, oshpazController filters by:
    // request_type: { in: ['RoomService', 'FoodOrder', 'Food'] }
    // If we use "Food", maybe we can't add details.
    // But since it's just a demo, I will use 'FoodOrder' and 'RoomService'.
    
    // Actually, GuestRequest has no details field. I'll just create a few.
    await prisma.guestRequest.create({
      data: {
        guest_id: guest.id,
        room_id: room.id,
        request_type: 'FoodOrder',
        status: 'Pending'
      }
    });

    await prisma.guestRequest.create({
      data: {
        guest_id: guest.id,
        room_id: room.id,
        request_type: 'RoomService',
        status: 'Accepted'
      }
    });

    console.log('Oshpazga misol buyurtmalar yuborildi!');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedKitchenOrders();
