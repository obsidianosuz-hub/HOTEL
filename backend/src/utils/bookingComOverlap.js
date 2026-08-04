// Biznes qoida: bitta xona bir xil sanalarga ikki marta bron qilinmasin
async function findOverlappingBooking(prisma, room_id, checkIn, checkOut, excludeBookingId) {
  return prisma.booking.findFirst({
    where: {
      room_id,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ['PendingPayment', 'Upcoming', 'Active'] },
      check_in_date: { lt: checkOut },
      check_out_date: { gt: checkIn }
    }
  });
}

module.exports = { findOverlappingBooking };
