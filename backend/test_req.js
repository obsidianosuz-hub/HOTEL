const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // We will create two supply requests
    await prisma.supplyRequest.create({
      data: {
        user_id: 1, // Assume 1 is valid, we don't strictly enforce fkey or maybe we do
        department: 'Farrosh',
        custom_item: 'Karcher changyutgich uchun filtr',
        quantity: 2,
        status: 'Pending'
      }
    });

    await prisma.supplyRequest.create({
      data: {
        user_id: 1,
        department: 'Oshpaz',
        custom_item: 'Tuxum (10 qadoq)',
        quantity: 10,
        status: 'Pending'
      }
    });
    console.log('Test requests created');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
