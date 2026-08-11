const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.findFirst({ where: { name: 'Procurement' } });
  const perms = await prisma.permission.findMany({ where: { role_id: role.id } });
  fs.writeFileSync('perms.json', JSON.stringify(perms, null, 2));
}
main();
