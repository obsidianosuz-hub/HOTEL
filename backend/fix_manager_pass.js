const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  await prisma.user.update({
    where: { email: 'manager@hotel.com' },
    data: { password_hash: hash }
  });
  console.log('Manager password updated successfully to Password123!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
