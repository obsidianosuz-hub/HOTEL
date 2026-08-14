const prisma = require('./src/utils/prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  const email = 'housekeeping@hotel.com';
  const newPassword = 'password123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password_hash: hashedPassword }
  });
  
  console.log(`Password for ${email} has been reset to: ${newPassword}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
