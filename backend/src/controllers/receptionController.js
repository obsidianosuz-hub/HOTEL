const prisma = require('../utils/prismaClient');
const { randomBytes } = require('crypto');
const { toJson, fromJson } = require('../utils/jsonHelper');
const { findOverlappingBooking } = require('../utils/bookingComOverlap');
const { findLeastBusyHousekeepingStaff } = require('../utils/staffAssignment');


// Generate unique Booking Code
const generateBookingCode = () => `BKG-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

// 1.1 Dashboard (kunlik statistika)
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const arrivalsCount = await prisma.booking.count({ where: { check_in_date: { equals: today }, status: 'Upcoming' } });
    const departuresCount = await prisma.booking.count({ where: { check_out_date: { equals: today }, status: 'Active' } });
    const inHouseCount = await prisma.booking.count({ where: { status: 'Active' } });
    const availableRoomsCount = await prisma.room.count({ where: { reception_status: 'Available' } });

    res.json({ arrivalsCount, departuresCount, inHouseCount, availableRoomsCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.2 Check-in
exports.checkIn = async (req, res) => {
  try {
    const { booking_code, passport_id, id_proof_type, special_requests } = req.body;

    // Biznes qoida: Hujjat tasdiqlangan bo'lishi shart
    if (!passport_id || !id_proof_type) {
      return res.status(422).json({ error: 'ID proof is required for check-in' });
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_code },
      include: { payments: { where: { status: 'Completed' } }, extra_charges: true }
    });
    if (!booking || booking.status !== 'Upcoming') {
      return res.status(400).json({ error: 'Booking not found or not ready for check-in' });
    }

    // Update Guest passport details
    await prisma.guest.update({
      where: { id: booking.guest_id },
      data: { passport_id, id_proof_type }
    });

    // Mark check-in
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'Active',
        id_proof_verified: true,
        special_requests
      }
    });

    // Update Room Status
    await prisma.room.update({
      where: { id: booking.room_id },
      data: { reception_status: 'Occupied' }
    });

    // Real-time update emit
    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: booking.room_id, status: 'Occupied' });

    // payment_model-aware balance — informational only, check-in is never hard-blocked on it
    const alreadyPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExtra = booking.extra_charges.reduce((sum, e) => sum + e.amount, 0);
    const balance_due = Math.max(0, booking.total_price + totalExtra - alreadyPaid);

    res.json({ message: 'Check-in successful', booking: { ...updatedBooking, balance_due } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.3 Check-out
exports.checkOut = async (req, res) => {
  try {
    const { booking_code, room_condition } = req.body; // clean, minor_damage, major_damage

    const booking = await prisma.booking.findUnique({ 
      where: { booking_code },
      include: { extra_charges: true, payments: true }
    });

    if (!booking || booking.status !== 'Active') {
      return res.status(400).json({ error: 'Booking not active' });
    }

    const totalPaid = booking.payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
    const totalExtra = booking.extra_charges.reduce((sum, e) => sum + e.amount, 0);

    // Room price for a booking_com_collect reservation is normally netted to zero by the synthetic
    // 'booking_com' payment the webhook creates. Defensive fallback for the data-integrity edge case
    // where that payment is somehow missing: Booking.com already holds that money, don't ask for it here.
    let roomPriceOwed = booking.total_price;
    if (booking.payment_model === 'booking_com_collect') {
      const hasBookingComPayment = booking.payments.some(p => p.status === 'Completed' && p.payment_source === 'booking_com');
      if (!hasBookingComPayment) roomPriceOwed = 0;
    }

    const balance = (roomPriceOwed + totalExtra) - totalPaid;

    if (balance > 0) {
      return res.status(400).json({ error: 'Outstanding balance must be paid before check-out', balance });
    }

    // Process check-out
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'Completed' }
    });

    // Update Room to Cleaning
    await prisma.room.update({
      where: { id: booking.room_id },
      data: { reception_status: 'Cleaning', housekeeping_status: 'VacantDirty' }
    });

    // Add Housekeeping task — auto-assigned to whichever active Housekeeping staff currently has the fewest open tasks
    const assignee = await findLeastBusyHousekeepingStaff(prisma);
    if (assignee) {
      await prisma.housekeepingTask.create({
        data: {
          room_id: booking.room_id,
          assigned_to_user_id: assignee.id,
          priority: room_condition === 'major_damage' ? 'Urgent' : 'Normal',
          checklist: toJson([{ item: 'General Cleaning', done: false }])
        }
      });
    }

    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: booking.room_id, status: 'Cleaning' });

    res.json({ message: 'Check-out successful, Room sent to Cleaning' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.4 Rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ include: { room_type: true } });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.5 Create Booking
exports.createBooking = async (req, res) => {
  try {
    const guest_id = parseInt(req.body.guest_id);
    const room_id = parseInt(req.body.room_id);
    const { check_in_date, check_out_date, special_requests } = req.body;
    const source = req.body.source === 'BookingCom' ? 'BookingCom' : 'Direct';

    if (!guest_id || !room_id || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'guest_id, room_id, check_in_date, check_out_date are required' });
    }

    const guest = await prisma.guest.findUnique({ where: { id: guest_id } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const room = await prisma.room.findUnique({ where: { id: room_id }, include: { room_type: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (!(nights > 0)) {
      return res.status(400).json({ error: 'check_out_date must be after check_in_date' });
    }

    const overlapping = await findOverlappingBooking(prisma, room_id, checkIn, checkOut);
    if (overlapping) {
      return res.status(409).json({
        error: `Room ${room.room_number} is already booked for these dates (booking ${overlapping.booking_code})`
      });
    }

    // Narx serverda hisoblanadi (frontenddan ishonib olinmaydi)
    const total_price = nights * room.room_type.base_price;

    // Check balance logic (Guest Ledger rule)
    const allBookings = await prisma.booking.findMany({ where: { guest_id }, include: { payments: true } });
    let totalSpent = 0, totalPaid = 0;
    allBookings.forEach(b => {
      totalSpent += b.total_price;
      totalPaid += b.payments.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    });
    const balance = totalSpent - totalPaid;

    const warning = balance > 0 ? 'Warning: Guest has outstanding debt' : null;

    const newBooking = await prisma.booking.create({
      data: {
        booking_code: generateBookingCode(),
        guest_id,
        room_id,
        created_by_user_id: req.user.userId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_price,
        special_requests: special_requests || null,
        source,
        status: 'PendingPayment'
      }
    });

    res.status(201).json({ booking: newBooking, warning });
  } catch (error) {
    console.error('Reception CreateBooking Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.7 Search Guest by phone (New Booking modal uchun)
exports.searchGuestByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone is required' });

    const guest = await prisma.guest.findUnique({ where: { phone } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    res.json(guest);
  } catch (error) {
    console.error('Reception SearchGuest Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.7 Add Guest
exports.createGuest = async (req, res) => {
  try {
    const { full_name, phone, email, id_proof_type, address } = req.body;
    if (!full_name || !phone) {
      return res.status(400).json({ error: 'full_name and phone are required' });
    }

    const existing = await prisma.guest.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered', guest: existing });
    }

    const guest = await prisma.guest.create({
      data: { full_name, phone, email, id_proof_type, address }
    });

    res.status(201).json(guest);
  } catch (error) {
    console.error('Reception CreateGuest Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.8 Payments
exports.collectPayment = async (req, res) => {
  try {
    const { booking_code, amount, method } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { booking_code },
      include: {
        guest: { select: { full_name: true, phone: true } },
        room: { include: { room_type: true } },
        payments: { where: { status: 'Completed' } },
        extra_charges: true
      }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const alreadyPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExtra = booking.extra_charges.reduce((sum, e) => sum + e.amount, 0);
    const owed = booking.total_price + totalExtra - alreadyPaid;

    if (booking.source === 'BookingCom' && booking.payment_model === 'booking_com_collect' && amount > owed) {
      return res.status(400).json({
        error: `This reservation's room price was collected by Booking.com; you can only collect outstanding extra charges (max ${owed.toFixed(2)})`,
        max_collectable: owed
      });
    }

    const payment = await prisma.payment.create({
      data: {
        booking_id: booking.id,
        guest_id: booking.guest_id,
        amount,
        method,
        status: 'Completed',
        payment_source: 'hotel_direct',
        collected_by_user_id: req.user.userId
      },
      include: { collector: { select: { full_name: true } } }
    });

    const nights = Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / 86400000);
    const balanceDue = owed - amount;

    // Business Rule: Create Receipt automatically, with itemized breakdown
    const receipt = await prisma.receipt.create({
      data: {
        booking_id: booking.id,
        payment_id: payment.id,
        receipt_number: `RCT-${Date.now()}`,
        items: {
          create: [
            { description: `Room ${booking.room.room_number} (${booking.room.room_type.name}) — ${nights} night(s)`, amount: booking.total_price },
            { description: `Payment received (${method})`, amount }
          ]
        }
      },
      include: { items: true }
    });

    if (booking.status === 'PendingPayment' && amount >= booking.total_price) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'Upcoming' }});
    }

    return res.json({
      payment,
      receipt,
      guest: booking.guest,
      room: booking.room,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      nights,
      total_price: booking.total_price,
      balance_due: balanceDue
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.9 Search Bookings
exports.searchBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        guest: true,
        room: true,
        payments: { where: { status: 'Completed' } },
        extra_charges: true
      }
    });

    const withBalance = bookings.map(({ payments, extra_charges, ...b }) => {
      const alreadyPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalExtra = extra_charges.reduce((sum, e) => sum + e.amount, 0);
      let roomPriceOwed = b.total_price;
      if (b.payment_model === 'booking_com_collect' && payments.some(p => p.payment_source === 'booking_com')) {
        roomPriceOwed = 0; // already netted by the synthetic Booking.com payment
      }
      const balance_due = Math.max(0, roomPriceOwed + totalExtra - alreadyPaid);
      return { ...b, balance_due };
    });

    res.json(withBalance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.6 Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_code } = req.body;
    
    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.source === 'BookingCom') {
      return res.status(403).json({ error: 'Booking.com reservations cannot be cancelled from Reception — changes must come from Booking.com' });
    }
    if (booking.status !== 'Upcoming' && booking.status !== 'PendingPayment') {
      return res.status(400).json({ error: 'Only upcoming or pending bookings can be cancelled' });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'Cancelled' }
    });

    if (booking.room_id) {
      await prisma.room.update({
        where: { id: booking.room_id },
        data: { reception_status: 'Available' }
      });
      req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: booking.room_id, status: 'Available' });
    }

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'CANCEL_BOOKING',
        entity_type: 'Booking',
        entity_id: booking.id,
        metadata: toJson({ booking_code })
      }
    });

    res.json({ message: 'Booking cancelled successfully', booking: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.10 Get Current (Open) Cash Session for the logged-in user
exports.getCurrentCashSession = async (req, res) => {
  try {
    const session = await prisma.cashRegisterSession.findFirst({
      where: { user_id: req.user.userId, closed_at: null },
      orderBy: { opened_at: 'desc' }
    });
    if (!session) return res.json(null);

    // Kassa ochilgandan beri qabul qilingan naqd to'lovlar summasi (Z-report uchun)
    const cashCollected = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        collected_by_user_id: req.user.userId,
        method: 'Cash',
        status: 'Completed',
        created_at: { gte: session.opened_at }
      }
    });

    res.json({ ...session, cash_collected: cashCollected._sum.amount || 0 });
  } catch (error) {
    console.error('Reception CurrentCashSession Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.10 Open Cash Session
exports.openCashSession = async (req, res) => {
  try {
    const { opening_balance } = req.body;

    const existing = await prisma.cashRegisterSession.findFirst({
      where: { user_id: req.user.userId, closed_at: null }
    });
    if (existing) return res.status(400).json({ error: 'A cash session is already open' });

    const session = await prisma.cashRegisterSession.create({
      data: {
        user_id: req.user.userId,
        opening_balance: parseFloat(opening_balance),
        opened_at: new Date()
      }
    });
    res.status(201).json(session);
  } catch (error) {
    console.error('Reception OpenCash Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.11 Close Cash Session
exports.closeCashSession = async (req, res) => {
  try {
    const session_id = parseInt(req.body.session_id);
    const { closing_balance, z_report_data } = req.body;

    const session = await prisma.cashRegisterSession.findUnique({ where: { id: session_id } });
    if (!session || session.closed_at) {
      return res.status(400).json({ error: 'Session not open' });
    }
    if (session.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'This is not your session' });
    }

    const updated = await prisma.cashRegisterSession.update({
      where: { id: session_id },
      data: {
        closing_balance: parseFloat(closing_balance),
        closed_at: new Date(),
        z_report_data: toJson(z_report_data)
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Reception CloseCash Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.12 Get Receipts
exports.getReceipts = async (req, res) => {
  try {
    const { booking_code } = req.params;
    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const receipts = await prisma.receipt.findMany({
      where: { booking_id: booking.id },
      include: { items: true, payment: true }
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.11 Search Guests (by name or phone — for Guest Ledger lookup)
exports.searchGuests = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? { OR: [{ full_name: { contains: search } }, { phone: { contains: search } }] }
      : {};
    const guests = await prisma.guest.findMany({ where, take: 20, orderBy: { full_name: 'asc' } });
    res.json(guests);
  } catch (error) {
    console.error('Reception SearchGuests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.13 Get Guest Ledger
exports.getGuestLedger = async (req, res) => {
  try {
    const guest_id = parseInt(req.params.guest_id);
    const guest = await prisma.guest.findUnique({ where: { id: guest_id } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const bookings = await prisma.booking.findMany({
      where: { guest_id },
      include: { payments: true, room: { include: { room_type: true } } },
      orderBy: { created_at: 'desc' }
    });

    let totalSpent = 0;
    let totalNights = 0;
    const activeBookings = bookings.filter(b => b.status !== 'Cancelled');

    bookings.forEach(b => {
      totalSpent += b.payments.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    });
    activeBookings.forEach(b => {
      totalNights += Math.ceil((new Date(b.check_out_date) - new Date(b.check_in_date)) / 86400000);
    });

    const totalBilled = activeBookings.reduce((s, b) => s + b.total_price, 0);
    const balance = totalBilled - totalSpent; // musbat = mehmon qarzdor, manfiy = ortiqcha to'lagan

    res.json({
      guest,
      total_bookings: bookings.length,
      total_stays_nights: totalNights,
      total_spent: totalSpent,
      balance,
      bookings
    });
  } catch (error) {
    console.error('Reception GuestLedger Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.15 List a booking's hotel-collected completed payments (for the Refund UI lookup)
exports.getBookingPayments = async (req, res) => {
  try {
    const { booking_code } = req.params;
    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const payments = await prisma.payment.findMany({
      where: { booking_id: booking.id, status: 'Completed', payment_source: 'hotel_direct' },
      include: { refunds: true },
      orderBy: { created_at: 'desc' }
    });

    const withRefundable = payments.map(p => {
      const refunded = p.refunds.reduce((sum, r) => sum + r.amount, 0);
      return { ...p, refundable_amount: Math.max(0, p.amount - refunded) };
    });

    res.json(withRefundable);
  } catch (error) {
    console.error('Reception GetBookingPayments Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.16 Refund a hotel-collected payment (never a Booking.com-collected room price)
exports.refundPayment = async (req, res) => {
  try {
    const payment_id = parseInt(req.body.payment_id);
    const amount = parseFloat(req.body.amount);
    const { reason } = req.body;

    if (!payment_id || !(amount > 0)) {
      return res.status(400).json({ error: 'payment_id and a positive amount are required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: payment_id },
      include: { refunds: true }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.payment_source !== 'hotel_direct') {
      return res.status(403).json({ error: 'This payment was collected by Booking.com and cannot be refunded from this system' });
    }
    if (payment.status !== 'Completed') {
      return res.status(400).json({ error: `Payment status is '${payment.status}', only Completed payments can be refunded` });
    }

    const alreadyRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    const remaining = payment.amount - alreadyRefunded;
    if (amount > remaining) {
      return res.status(400).json({ error: `Refund amount exceeds remaining refundable balance (max ${remaining.toFixed(2)})` });
    }

    const refund = await prisma.refund.create({
      data: {
        payment_id: payment.id,
        amount,
        reason: reason || null,
        refunded_by_user_id: req.user.userId
      }
    });

    if (amount === remaining) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'Refunded' } });
    }

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'PAYMENT_REFUNDED',
        entity_type: 'Payment',
        entity_id: payment.id,
        metadata: toJson({ amount, reason })
      }
    });

    res.json({ message: 'Refund processed successfully', refund });
  } catch (error) {
    console.error('Reception RefundPayment Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 1.14 Get Daily Report
exports.getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIns = await prisma.booking.count({ where: { check_in_date: { equals: today }, status: 'Active' } });
    const checkOuts = await prisma.booking.count({ where: { check_out_date: { equals: today }, status: 'Completed' } });
    const bookings = await prisma.booking.count({ where: { created_at: { gte: today } } });
    
    const payments = await prisma.payment.aggregate({
      where: { status: 'Completed', created_at: { gte: today } },
      _sum: { amount: true }
    });

    res.json({
      checkIns,
      checkOuts,
      bookingsCount: bookings,
      revenue: payments._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
