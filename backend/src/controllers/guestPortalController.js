const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMyBill = async (req, res) => {
  try {
    const bookingId = req.guest.bookingId;
    if (!bookingId) return res.status(403).json({ error: 'Not a guest' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { room_type: true } },
        extra_charges: true
      }
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const guestId = req.guest.guestId;
    if (!guestId) return res.status(403).json({ error: 'Not a guest' });

    const requests = await prisma.guestRequest.findMany({
      where: { guest_id: guestId },
      orderBy: { created_at: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitRequest = async (req, res) => {
  try {
    const { request_type } = req.body;
    const bookingId = req.guest.bookingId;
    const guestId = req.guest.guestId;

    if (!bookingId) {
      return res.status(400).json({ error: 'No active booking found for this session. Please login with a valid booking code.' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const newRequest = await prisma.guestRequest.create({
      data: {
        guest_id: guestId,
        room_id: booking.room_id,
        request_type,
        status: 'Pending'
      },
      include: {
        room: true,
        guest: true
      }
    });

    // Real-time socket event to Reception/Bellboy/Housekeeping
    req.io.emit('new-guest-request', newRequest);

    res.json({ message: 'Request submitted successfully', data: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitOrder = async (req, res) => {
  try {
    const { items, total_price } = req.body;
    const bookingId = req.guest.bookingId;
    const guestId = req.guest.guestId;

    if (!bookingId) {
      return res.status(400).json({ error: 'No active booking found for this session. Please login with a valid booking code.' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // 1. Create a GuestRequest of type "FoodOrder" to track status
    const newRequest = await prisma.guestRequest.create({
      data: {
        guest_id: guestId,
        room_id: booking.room_id,
        request_type: 'FoodOrder',
        details: JSON.stringify(items),
        status: 'Pending'
      },
      include: {
        room: true,
        guest: true
      }
    });

    // 2. Add total_price to the Hotel Bill (BookingExtraCharge)
    await prisma.bookingExtraCharge.create({
      data: {
        booking_id: bookingId,
        description: `Room Service Order #${newRequest.id}`,
        amount: total_price
      }
    });

    // Real-time socket event to Kitchen/Reception
    req.io.emit('new-guest-request', newRequest);

    res.json({ message: 'Order submitted and added to bill', data: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const menuModel = require('../models/menuModel');

exports.getMenu = (req, res) => {
  try {
    const menu = menuModel.getAll().filter(item => item.is_available);
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
