const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO Vendor (name, category, contact_info, email, phone, address, tax_id, website, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 'Test Name', 'Test Cat', null, null, null, null, null, null, null, 'Active');
    console.log(result);
  } catch (e) {
    console.error(e);
  }
}

run();
