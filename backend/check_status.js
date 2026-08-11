const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'manager@hotel.com' } });
  console.log("Status:", u?.status);
  console.log("Password Hash:", u?.password_hash);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
