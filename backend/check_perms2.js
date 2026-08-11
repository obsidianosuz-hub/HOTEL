const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  try {
    const role = await prisma.role.findFirst({ where: { name: 'Procurement' } });
    if (!role) {
       fs.writeFileSync('perms2.txt', 'Role not found');
       return;
    }
    const perms = await prisma.permission.findMany({ where: { role_id: role.id } });
    fs.writeFileSync('perms2.txt', JSON.stringify(perms, null, 2));
  } catch (e) {
    fs.writeFileSync('perms2.txt', e.toString());
  }
}
main();
