const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'manager@hotel.com' } });
  if (!user) {
    console.log("No manager found");
    return;
  }
  console.log("Found user:", user.email);
  const match = await bcrypt.compare('Password123!', user.password);
  console.log('Match with Password123!:', match);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
