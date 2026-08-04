const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const receptionRoutes = require('./routes/receptionRoutes');
const guestRoutes = require('./routes/guestRoutes');
const housekeepingRoutes = require('./routes/housekeepingRoutes');
const bellboyRoutes = require('./routes/bellboyRoutes');
const managerRoutes = require('./routes/managerRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentGatewayRoutes = require('./routes/paymentGatewayRoutes');
const bookingComWebhookRoutes = require('./routes/bookingComWebhookRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const server = http.createServer(app);

// WebSockets Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Attach socket.io to req object so routes can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
// rawBody is captured for webhook signature verification (Booking.com HMAC check)
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// Uploaded files (room photos, etc.) — served statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==========================================
// Socket.io JWT Autentifikatsiya va Rolga Asoslangan Room'lar
// ==========================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const tokenType = socket.handshake.auth.type || 'staff'; // 'staff' yoki 'guest'

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    if (tokenType === 'guest') {
      const decoded = jwt.verify(token, process.env.JWT_GUEST_SECRET);
      socket.guestId = decoded.guestId;
      socket.userType = 'guest';
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.roleId = decoded.roleId;
      socket.roleName = decoded.roleName;
      socket.userType = 'staff';
    }
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (${socket.userType})`);

  // Rolga asoslangan room'larga avtomatik qo'shish
  if (socket.userType === 'staff') {
    socket.join('staff-updates'); // Barcha xodimlar uchun umumiy
    socket.join(`user-${socket.userId}`); // Shaxsiy xona (Force logout va shaxsiy bildirishnomalar uchun)
    
    // Rolga qarab maxsus kanal
    switch (socket.roleName) {
      case 'Reception':
      case 'Manager':
      case 'Admin':
        socket.join('reception-updates');
        socket.join('manager-updates');
        break;
      case 'Housekeeping':
      case 'HousekeepingSupervisor':
        socket.join('housekeeping-updates');
        break;
      case 'Bellboy':
        socket.join('bellboy-updates');
        break;
      case 'Procurement':
        socket.join('procurement-updates');
        break;
    }

    if (socket.roleName === 'Admin') {
      socket.join('admin-updates');
    }

    console.log(`Staff ${socket.userId} (${socket.roleName}) joined role-based rooms`);
  } else if (socket.userType === 'guest') {
    // Mehmon faqat o'z bronlarini oladi
    socket.join(`guest-${socket.guestId}`);
    console.log(`Guest ${socket.guestId} joined personal room`);
  }

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/bellboy', bellboyRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentGatewayRoutes);
app.use('/api/webhooks', bookingComWebhookRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Hotel ERP Backend is running' });
});

module.exports = { server, io, app };

