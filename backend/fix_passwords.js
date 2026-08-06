const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const newHash = await bcrypt.hash('Password123!', 10);
  
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'asc' }
  });

  console.log('\n=== Barcha foydalanuvchilar ===');
  for (const user of users) {
    const ok = await bcrypt.compare('Password123!', user.password_hash);
    console.log(`${user.email} | ${user.role?.name} | Parol: ${ok ? 'OK' : 'NOTOGRI - yangilanadi'}`);
    if (!ok) {
      await prisma.user.update({ where: { id: user.id }, data: { password_hash: newHash } });
    }
  }

  await prisma.$disconnect();
  console.log('\nHamma parollar Password123! ga tenglashtirildi.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
