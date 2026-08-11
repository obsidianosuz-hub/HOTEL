const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  try {
    const booking_code = 'BKG-2026-59DDE3';
    const full_name = 'Test Guest One';

    const booking = await prisma.booking.findUnique({
      where: { booking_code },
      include: { guest: true }
    });

    if (!booking || !booking.guest) {
      console.log('Not found');
      return;
    }

    if (full_name) {
      const guestName = booking.guest.full_name.toLowerCase();
      const inputName = full_name.toLowerCase().trim();
      
      if (!guestName.includes(inputName) && !inputName.includes(guestName)) {
        console.log('Name mismatch');
        return;
      }
    }

    const token = jwt.sign(
      { guestId: booking.guest.id, bookingId: booking.id },
      'hotel-erp-guest-secret-key-2026', // Use hardcoded to test
      { expiresIn: '7d' }
    );

    console.log({ token, guest: { id: booking.guest.id, name: booking.guest.full_name, phone: booking.guest.phone, booking_code: booking.booking_code } });
  } catch (error) {
    console.error('ERROR OCCURRED:');
    console.error(error);
  }
}
main();
