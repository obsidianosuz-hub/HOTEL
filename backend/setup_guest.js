const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  await prisma.guest.update({
    where: { id: 1 },
    data: { password_hash: hash }
  });
  console.log('Guest password updated successfully.');
}
main();
