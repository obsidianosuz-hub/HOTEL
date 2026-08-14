const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  console.log(users.map(u => ({id: u.id, name: u.full_name, email: u.email, role: u.role.name})));
}
main();
