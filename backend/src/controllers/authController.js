const prisma = require('../utils/prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// PUBLIC SETTINGS (For Login & App Initialization)
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await prisma.hotelSettings.findFirst();
    if (!settings) {
      return res.json({ name: 'Hotel ERP', logo_url: null, theme_color: '#0f766e', description: '' });
    }
    res.json({
      name: settings.name,
      logo_url: settings.logo_url,
      theme_color: settings.theme_color,
      description: settings.description
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// STAFF LOGIN
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true }
    });

    if (!user || user.status !== 'Active') {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch permissions for this role
    const permissions = await prisma.permission.findMany({
      where: { role_id: user.role_id }
    });

    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id, roleName: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.full_name, 
        role: user.role.name,
        permissions: permissions
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GUEST LOGIN (Step 1: Check credentials and send OTP)
exports.guestLogin = async (req, res) => {
  try {
    const { booking_code, full_name } = req.body;
    const clean_booking_code = booking_code ? booking_code.trim().toUpperCase() : null;

    if (!clean_booking_code) {
      return res.status(400).json({ error: 'Booking Code is required' });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { booking_code: clean_booking_code },
      include: { guest: true }
    });

    if (!booking || !booking.guest) {
      return res.status(401).json({ error: 'Invalid Booking Code. Not found in Reception.' });
    }

    // Validate full name roughly
    if (full_name) {
      const guestName = booking.guest.full_name.toLowerCase();
      const inputName = full_name.toLowerCase().trim();
      
      if (!guestName.includes(inputName) && !inputName.includes(guestName)) {
        return res.status(401).json({ error: 'Name does not match the booking record.' });
      }
    }

    // Issue token directly
    const token = jwt.sign(
      { guestId: booking.guest.id, bookingId: booking.id },
      process.env.JWT_GUEST_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      guest: {
        id: booking.guest.id,
        full_name: booking.guest.full_name,
        phone: booking.guest.phone,
        language: booking.guest.language,
        booking_code: booking.booking_code
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GUEST LOGIN (Step 2: Verify OTP and return token)
exports.verifyGuestOtp = async (req, res) => {
  try {
    const { booking_code, otp } = req.body;
    const clean_booking_code = booking_code ? booking_code.trim().toUpperCase() : null;

    if (!clean_booking_code || !otp) {
      return res.status(400).json({ error: 'Booking code and OTP are required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_code: clean_booking_code },
      include: { guest: true }
    });

    if (!booking || !booking.guest) {
      return res.status(401).json({ error: 'Invalid Booking Code.' });
    }

    const guest = booking.guest;

    if (guest.otp_code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP code.' });
    }

    if (new Date() > new Date(guest.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // OTP correct, clear it and issue token
    await prisma.guest.update({
      where: { id: guest.id },
      data: { otp_code: null, otp_expires_at: null }
    });

    const token = jwt.sign(
      { guestId: guest.id, bookingId: booking.id },
      process.env.JWT_GUEST_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, guest: { id: guest.id, name: guest.full_name, phone: guest.phone, booking_code: booking.booking_code } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GUEST REGISTER
exports.guestRegister = async (req, res) => {
  try {
    const { full_name, phone, email, password } = req.body;

    const existingGuest = await prisma.guest.findUnique({ where: { phone } });
    if (existingGuest) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    const guest = await prisma.guest.create({
      data: {
        full_name,
        phone,
        email,
        password_hash
      }
    });

    const token = jwt.sign(
      { guestId: guest.id },
      process.env.JWT_GUEST_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, guest: { id: guest.id, name: guest.full_name, phone: guest.phone } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
