const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const EMAILS = [
  'admin@hotel.com',
  'manager@hotel.com',
  'reception@hotel.com',
  'housekeeping@hotel.com',
  'bellboy@hotel.com',
  'procurement@hotel.com'
];

const SIMPLE_PASSWORD = 'hotel12345';

async function main() {
  const password_hash = await bcrypt.hash(SIMPLE_PASSWORD, 10);
  for (const email of EMAILS) {
    const updated = await prisma.user.update({ where: { email }, data: { password_hash, status: 'Active' } });
    console.log('Reset password for', updated.email);
  }
}
main().finally(() => prisma.$disconnect());
