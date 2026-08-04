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

    const token = jwt.sign(
      { userId: user.id, roleId: user.role_id, roleName: user.role.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.full_name, role: user.role.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GUEST LOGIN
exports.guestLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const guest = await prisma.guest.findUnique({ where: { phone } });
    if (!guest || !guest.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, guest.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { guestId: guest.id },
      process.env.JWT_GUEST_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, guest: { id: guest.id, name: guest.full_name, phone: guest.phone } });
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
