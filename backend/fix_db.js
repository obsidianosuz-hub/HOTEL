const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN email TEXT;'); console.log('email added'); } catch (e) { console.log(e.message); }
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN phone TEXT;'); console.log('phone added'); } catch (e) { console.log(e.message); }
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN address TEXT;'); console.log('address added'); } catch (e) { console.log(e.message); }
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN tax_id TEXT;'); console.log('tax_id added'); } catch (e) { console.log(e.message); }
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN website TEXT;'); console.log('website added'); } catch (e) { console.log(e.message); }
}

run();
