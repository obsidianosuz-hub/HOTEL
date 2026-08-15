const { Client } = require('ssh2');
const conn = new Client();

const remoteScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  const hash = await bcrypt.hash('password123', 10);
  for (const u of users) {
    await prisma.user.update({ where: { id: u.id }, data: { password_hash: hash } });
  }
  console.log('All passwords reset to password123');
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

conn.on('ready', () => {
  console.log('Connected to server. Executing script...');
  const safeScript = Buffer.from(remoteScript).toString('base64');
  const bashCmd = `cd /home/itcloud/hotel_erp_app/backend && echo "${safeScript}" | base64 -d > temp_reset.js && node temp_reset.js && rm temp_reset.js`;
  
  conn.exec(bashCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Command closed with code:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });

}).connect({
  host: '100.92.238.113',
  port: 22,
  username: 'itcloud',
  password: 'clone1997'
});
