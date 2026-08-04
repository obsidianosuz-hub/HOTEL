const prisma = require('../utils/prismaClient');
const { randomBytes } = require('crypto');

const generateBookingCode = () => `BKG-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

// 7.2 Home / Room Search
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, capacity } = req.query;
    
    // In a real app, query overlapping bookings and filter out occupied rooms.
    // For simplicity, returning all available rooms.
    const rooms = await prisma.room.findMany({
      where: { reception_status: 'Available' },
      include: { room_type: true }
    });
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.3 Booking Process
exports.createDraftBooking = async (req, res) => {
  try {
    const { room_id, check_in_date, check_out_date, special_requests } = req.body;
    const guestId = req.guest.guestId;

    const room = await prisma.room.findUnique({ where: { id: room_id }, include: { room_type: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const diffTime = Math.abs(new Date(check_out_date) - new Date(check_in_date));
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const total_price = nights * room.room_type.base_price;

    const newBooking = await prisma.booking.create({
      data: {
        booking_code: generateBookingCode(),
        guest_id: guestId,
        room_id,
        check_in_date: new Date(check_in_date),
        check_out_date: new Date(check_out_date),
        total_price,
        special_requests,
        status: 'PendingPayment'
      }
    });

    res.status(201).json({ booking: newBooking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.5 My Bookings
exports.getMyBookings = async (req, res) => {
  try {
    const guestId = req.guest.guestId;
    const bookings = await prisma.booking.findMany({
      where: { guest_id: guestId },
      include: { room: { include: { room_type: true } } }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.5 Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_code } = req.params;
    const guestId = req.guest.guestId;

    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking || booking.guest_id !== guestId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'Active' || booking.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel active or completed booking' });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'Cancelled' }
    });

    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.6 Receipt
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const guestId = req.guest.guestId;

    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: { booking: true, payment: true }
    });

    if (!receipt || receipt.booking.guest_id !== guestId) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.7 Settings
exports.updateSettings = async (req, res) => {
  try {
    const guestId = req.guest.guestId;
    const { full_name, language, notif_settings } = req.body;

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: { full_name, language, notif_settings }
    });

    res.json(updatedGuest);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 7.8 Support Requests
exports.createSupportRequest = async (req, res) => {
  try {
    const guestId = req.guest.guestId;
    const { subject, message } = req.body;

    const request = await prisma.supportRequest.create({
      data: {
        guest_id: guestId,
        subject,
        message
      }
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
