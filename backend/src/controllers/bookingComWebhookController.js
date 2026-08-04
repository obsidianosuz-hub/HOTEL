const crypto = require('crypto');
const prisma = require('../utils/prismaClient');
const { toJson, fromJson } = require('../utils/jsonHelper');
const { findOverlappingBooking } = require('../utils/bookingComOverlap');
const cryptoHelper = require('../utils/cryptoHelper');

const generateBookingCode = () => `BKG-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// Expected payload shape (assumption — no real Booking.com Partner API contract exists yet):
// {
//   event_type: 'reservation.created' | 'reservation.modified' | 'reservation.cancelled',
//   reservation: {
//     external_reservation_id, room_number, check_in_date, check_out_date,
//     payment_model: 'booking_com_collect' | 'hotel_collect',
//     commission_rate?, special_requests?,
//     guest: { full_name, phone, email? }
//   }
// }

async function verifyWebhookSignature(req) {
  const integration = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
  if (!integration) return false;

  const config = fromJson(integration.config) || {};
  if (!config.webhook_shared_secret_encrypted) return false;

  let secret;
  try {
    secret = cryptoHelper.decrypt(config.webhook_shared_secret_encrypted);
  } catch {
    return false;
  }
  if (!secret) return false;

  const signature = req.headers['x-bookingcom-signature'];
  if (!signature || !req.rawBody) return false;

  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function handleReservationCreated(payload, io) {
  const r = payload?.reservation;
  if (!r || !r.external_reservation_id || !r.room_number || !r.check_in_date || !r.check_out_date || !r.payment_model || !r.guest?.phone || !r.guest?.full_name) {
    return { success: false, message: 'Invalid payload: missing required reservation fields' };
  }
  if (!['booking_com_collect', 'hotel_collect'].includes(r.payment_model)) {
    return { success: false, message: `Invalid payment_model: ${r.payment_model}` };
  }

  // Idempotency: Booking.com may resend the same event
  const existing = await prisma.bookingComReservation.findUnique({ where: { external_reservation_id: r.external_reservation_id } });
  if (existing) {
    return { success: true, message: 'Already processed (idempotent)', bookingId: existing.booking_id };
  }

  const room = await prisma.room.findUnique({ where: { room_number: String(r.room_number) }, include: { room_type: true } });
  if (!room) return { success: false, message: `Room ${r.room_number} not found` };

  const checkIn = new Date(r.check_in_date);
  const checkOut = new Date(r.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  if (!(nights > 0)) return { success: false, message: 'check_out_date must be after check_in_date' };

  const overlapping = await findOverlappingBooking(prisma, room.id, checkIn, checkOut);
  if (overlapping) {
    return { success: false, message: `Room ${room.room_number} is already booked for these dates (booking ${overlapping.booking_code})` };
  }

  let guest = await prisma.guest.findUnique({ where: { phone: r.guest.phone } });
  if (!guest) {
    guest = await prisma.guest.create({
      data: { full_name: r.guest.full_name, phone: r.guest.phone, email: r.guest.email || null }
    });
  }

  const total_price = nights * room.room_type.base_price;

  const integration = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
  const integrationConfig = integration ? (fromJson(integration.config) || {}) : {};
  const commission_rate = r.commission_rate ?? integrationConfig.commission_rate ?? null;
  const commission_amount = commission_rate != null ? +(total_price * commission_rate / 100).toFixed(2) : null;

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        booking_code: generateBookingCode(),
        guest_id: guest.id,
        room_id: room.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price,
        special_requests: r.special_requests || null,
        source: 'BookingCom',
        payment_model: r.payment_model,
        status: 'Upcoming' // Booking.com's confirmation is itself authoritative
      }
    });

    await tx.bookingComReservation.create({
      data: {
        external_reservation_id: r.external_reservation_id,
        booking_id: booking.id,
        payment_model: r.payment_model,
        commission_rate,
        commission_amount,
        status: 'Confirmed',
        guest_name: r.guest.full_name,
        guest_phone: r.guest.phone,
        guest_email: r.guest.email || null,
        raw_payload: toJson(payload)
      }
    });

    if (r.payment_model === 'booking_com_collect') {
      const payment = await tx.payment.create({
        data: {
          booking_id: booking.id,
          guest_id: guest.id,
          amount: total_price,
          method: 'Online',
          gateway_name: 'BookingCom',
          status: 'Completed',
          payment_source: 'booking_com'
        }
      });

      const receipt = await tx.receipt.create({
        data: {
          booking_id: booking.id,
          payment_id: payment.id,
          receipt_number: `RCT-BDC-${Date.now()}`
        }
      });

      await tx.receiptItem.create({
        data: { receipt_id: receipt.id, description: `Room ${room.room_number} — paid via Booking.com`, amount: total_price }
      });
    }

    return booking;
  });

  if (io) {
    io.to('reception-updates').to('manager-updates').emit('booking-com-reservation-created', {
      bookingId: result.id,
      externalReservationId: r.external_reservation_id,
      roomId: room.id,
      paymentModel: r.payment_model
    });
  }

  return { success: true, message: 'Reservation created', bookingId: result.id };
}

async function handleReservationModified(payload, io) {
  const r = payload?.reservation;
  if (!r || !r.external_reservation_id) {
    return { success: false, message: 'Invalid payload: missing external_reservation_id' };
  }

  const reservation = await prisma.bookingComReservation.findUnique({
    where: { external_reservation_id: r.external_reservation_id },
    include: { booking: true }
  });
  if (!reservation || !reservation.booking) {
    return { success: false, message: `No known reservation for external_reservation_id ${r.external_reservation_id}` };
  }

  const checkIn = r.check_in_date ? new Date(r.check_in_date) : reservation.booking.check_in_date;
  const checkOut = r.check_out_date ? new Date(r.check_out_date) : reservation.booking.check_out_date;

  let room = null;
  if (r.room_number) {
    room = await prisma.room.findUnique({ where: { room_number: String(r.room_number) }, include: { room_type: true } });
    if (!room) return { success: false, message: `Room ${r.room_number} not found` };
  }
  const roomId = room ? room.id : reservation.booking.room_id;

  const overlapping = await findOverlappingBooking(prisma, roomId, checkIn, checkOut, reservation.booking.id);
  if (overlapping) {
    return { success: false, message: `Room is already booked for these dates (booking ${overlapping.booking_code})` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: reservation.booking.id },
      data: { check_in_date: checkIn, check_out_date: checkOut, room_id: roomId }
    });
    await tx.bookingComReservation.update({
      where: { id: reservation.id },
      data: { status: 'Modified', raw_payload: toJson(payload) }
    });
  });

  if (io) {
    io.to('reception-updates').to('manager-updates').emit('booking-com-reservation-modified', {
      bookingId: reservation.booking.id,
      externalReservationId: r.external_reservation_id
    });
  }

  return { success: true, message: 'Reservation modified', bookingId: reservation.booking.id };
}

async function handleReservationCancelled(payload, io) {
  const r = payload?.reservation;
  if (!r || !r.external_reservation_id) {
    return { success: false, message: 'Invalid payload: missing external_reservation_id' };
  }

  const reservation = await prisma.bookingComReservation.findUnique({
    where: { external_reservation_id: r.external_reservation_id },
    include: { booking: true }
  });
  if (!reservation || !reservation.booking) {
    return { success: false, message: `No known reservation for external_reservation_id ${r.external_reservation_id}` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: reservation.booking.id }, data: { status: 'Cancelled' } });
    await tx.bookingComReservation.update({
      where: { id: reservation.id },
      data: { status: 'Cancelled', raw_payload: toJson(payload) }
    });
    await tx.room.update({ where: { id: reservation.booking.room_id }, data: { reception_status: 'Available' } });
  });

  if (io) {
    io.to('reception-updates').to('housekeeping-updates').to('manager-updates').emit('booking-com-reservation-cancelled', {
      bookingId: reservation.booking.id,
      roomId: reservation.booking.room_id,
      externalReservationId: r.external_reservation_id
    });
  }

  return { success: true, message: 'Reservation cancelled', bookingId: reservation.booking.id };
}

// Dispatches a parsed payload to the right handler. Reused by the live route AND the Admin retry endpoint.
async function processWebhookPayload(payload, io) {
  const eventType = payload?.event_type;
  switch (eventType) {
    case 'reservation.created':
      return handleReservationCreated(payload, io);
    case 'reservation.modified':
      return handleReservationModified(payload, io);
    case 'reservation.cancelled':
      return handleReservationCancelled(payload, io);
    default:
      return { success: false, message: `Unknown or missing event_type: ${eventType}` };
  }
}

// POST /api/webhooks/booking-com
exports.receiveWebhook = async (req, res) => {
  const payload = req.body || {};

  const validSignature = await verifyWebhookSignature(req);
  if (!validSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const log = await prisma.bookingComWebhookLog.create({
    data: {
      event_type: payload.event_type || 'unknown',
      external_reservation_id: payload.reservation?.external_reservation_id || null,
      payload: toJson(payload),
      processing_status: 'retrying'
    }
  });

  let result;
  try {
    result = await processWebhookPayload(payload, req.io);
  } catch (error) {
    console.error('BookingCom Webhook Processing Error:', error);
    result = { success: false, message: error.message || 'Unexpected server error' };
  }

  await prisma.bookingComWebhookLog.update({
    where: { id: log.id },
    data: {
      processing_status: result.success ? 'success' : 'failed',
      error_message: result.success ? null : result.message,
      processed_at: new Date()
    }
  });

  // Always 200 so Booking.com doesn't hammer retries on our own bugs — failures are visible in Admin > Webhook Logs.
  return res.status(200).json({ received: true, success: result.success, message: result.message });
};

exports.processWebhookPayload = processWebhookPayload;
exports.verifyWebhookSignature = verifyWebhookSignature;
