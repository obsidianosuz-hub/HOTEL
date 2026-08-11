const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO Vendor (name, category, contact_info, email, phone, address, tax_id, website, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 'Test Name2', 'Test Cat2', null, null, null, null, null, null, null, 'Active');
    fs.writeFileSync('test_out2.txt', JSON.stringify(result));
  } catch (e) {
    fs.writeFileSync('test_out2.txt', e.toString());
  }
}
run();
