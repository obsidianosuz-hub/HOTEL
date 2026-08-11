const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN email TEXT;'); } catch(e){}
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN phone TEXT;'); } catch(e){}
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN address TEXT;'); } catch(e){}
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN tax_id TEXT;'); } catch(e){}
  try { await prisma.$executeRawUnsafe('ALTER TABLE Vendor ADD COLUMN website TEXT;'); } catch(e){}
  console.log('Columns added');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
