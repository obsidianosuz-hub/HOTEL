const prisma = require('./utils/prismaClient');
const cron = require('node-cron');
const { toJson, fromJson } = require('./utils/jsonHelper');

/**
 * PendingPayment auto-cancel job
 * Har 5 daqiqada ishga tushadi va 15 daqiqa ichida to'lanmagan bronlarni bekor qiladi.
 * Biznes qoida: PendingPayment statusidagi bron 15 daqiqada to'lanmasa avtomatik Cancelled ga o'tadi.
 */
const startPendingPaymentCancelJob = (io) => {
  // Har 5 daqiqada tekshirish
  cron.schedule('*/5 * * * *', async () => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PendingPayment',
          created_at: { lte: fifteenMinutesAgo }
        }
      });

      if (expiredBookings.length === 0) return;

      console.log(`[CRON] Found ${expiredBookings.length} expired PendingPayment bookings`);

      for (const booking of expiredBookings) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'Cancelled' }
        });

        // Room'ni bo'shatish (agar band qilingan bo'lsa)
        // PendingPayment holatidagi bron hali xonani "Occupied" qilmagan,
        // lekin xonani qayta Available qilish kerak bo'lishi mumkin
        await prisma.room.updateMany({
          where: { id: booking.room_id, reception_status: { not: 'Occupied' } },
          data: { reception_status: 'Available' }
        });

        // AuditLog
        await prisma.auditLog.create({
          data: {
            action: 'BOOKING_AUTO_CANCELLED',
            entity_type: 'Booking',
            entity_id: booking.id,
            metadata: toJson({ booking_code: booking.booking_code, reason: '15 min payment timeout' })
          }
        });

        console.log(`[CRON] Auto-cancelled booking: ${booking.booking_code}`);
      }

      // Real-time xabar
      if (io) {
        io.to('reception-updates').to('manager-updates').emit('bookings-auto-cancelled', { count: expiredBookings.length });
      }
    } catch (error) {
      console.error('[CRON] PendingPayment cancel error:', error);
    }
  });

  console.log('[CRON] PendingPayment auto-cancel job started (every 5 min, 15 min timeout)');
};

module.exports = startPendingPaymentCancelJob;
