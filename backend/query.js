require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({include: {guest: true}});
  const result = bookings.map(b => `${b.booking_code} -> ${b.guest?.full_name}`);
  require('fs').writeFileSync('output.txt', result.join('\n'));
}

main().finally(() => process.exit());
