const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const defaultPassword = await bcrypt.hash('Password123!', 10);
  
  for (const u of users) {
    if (!u.password_hash) {
      console.log(`Setting default password for: ${u.email}`);
      await prisma.user.update({
        where: { id: u.id },
        data: { password_hash: defaultPassword }
      });
    }
  }
  console.log("All missing passwords updated.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
