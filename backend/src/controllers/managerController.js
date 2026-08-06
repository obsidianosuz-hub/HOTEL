const prisma = require('../utils/prismaClient');
const { toJson, fromJson } = require('../utils/jsonHelper');

// 4.1 Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({ where: { reception_status: 'Occupied' } });
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const todayPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'Completed', created_at: { gte: today } }
    });

    const activeBookings = await prisma.booking.count({ where: { status: 'Active' } });
    const pendingMaintenance = await prisma.maintenanceRequest.count({ where: { status: { in: ['New', 'InProgress'] } } });

    res.json({
      occupancyRate,
      occupiedRooms,
      totalRooms,
      todayRevenue: todayPayments._sum.amount || 0,
      activeBookings,
      pendingMaintenance
    });
  } catch (error) {
    console.error('MGR Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.1 Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const payments = await prisma.payment.findMany({
      where: { status: 'Completed', ...(from || to ? { created_at: dateFilter } : {}) },
      select: { amount: true, method: true, created_at: true }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = {};
    payments.forEach(p => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });

    res.json({ totalRevenue, byMethod, transactionCount: payments.length });
  } catch (error) {
    console.error('MGR Revenue Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.1 Occupancy Analytics
exports.getOccupancyAnalytics = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ include: { room_type: true } });
    const byType = {};

    rooms.forEach(r => {
      const typeName = r.room_type.name;
      if (!byType[typeName]) byType[typeName] = { total: 0, occupied: 0 };
      byType[typeName].total++;
      if (r.reception_status === 'Occupied') byType[typeName].occupied++;
    });

    Object.keys(byType).forEach(k => {
      byType[k].rate = byType[k].total > 0 ? Math.round((byType[k].occupied / byType[k].total) * 100) : 0;
    });

    res.json(byType);
  } catch (error) {
    console.error('MGR Occupancy Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.1 Channel Performance — revenue/commission breakdown by booking source (Direct vs Booking.com)
exports.getChannelPerformance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: 'Cancelled' },
        ...(from || to ? { created_at: dateFilter } : {})
      },
      select: {
        total_price: true,
        source: true,
        payment_model: true,
        booking_com_reservation: { select: { commission_amount: true } }
      }
    });

    const groups = {
      direct: { bookingCount: 0, grossRevenue: 0 },
      bookingComGuestPaid: { bookingCount: 0, grossRevenue: 0, commissionPaid: 0, netRevenue: 0 },
      bookingComHotelCollect: { bookingCount: 0, grossRevenue: 0, commissionPaid: 0, netRevenue: 0 }
    };

    bookings.forEach(b => {
      if (b.source !== 'BookingCom') {
        groups.direct.bookingCount++;
        groups.direct.grossRevenue += b.total_price;
        return;
      }
      const key = b.payment_model === 'hotel_collect' ? 'bookingComHotelCollect' : 'bookingComGuestPaid';
      const commission = b.booking_com_reservation?.commission_amount || 0;
      groups[key].bookingCount++;
      groups[key].grossRevenue += b.total_price;
      groups[key].commissionPaid += commission;
      groups[key].netRevenue += b.total_price - commission;
    });

    const totalCommissionPaid = groups.bookingComGuestPaid.commissionPaid + groups.bookingComHotelCollect.commissionPaid;
    const totalGrossRevenue = groups.direct.grossRevenue + groups.bookingComGuestPaid.grossRevenue + groups.bookingComHotelCollect.grossRevenue;
    const bookingComGrossRevenue = groups.bookingComGuestPaid.grossRevenue + groups.bookingComHotelCollect.grossRevenue;
    const commissionRateOfTotal = totalGrossRevenue > 0 ? +(totalCommissionPaid / totalGrossRevenue * 100).toFixed(2) : 0;

    res.json({
      ...groups,
      totalCommissionPaid,
      totalGrossRevenue,
      bookingComGrossRevenue,
      commissionRateOfTotal,
      highCommissionWarning: commissionRateOfTotal > 25
    });
  } catch (error) {
    console.error('MGR ChannelPerformance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.2 Get Staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { status: 'Active' },
      select: { id: true, full_name: true, email: true, phone: true, status: true, role: { select: { name: true } }, created_at: true }
    });
    res.json(staff);
  } catch (error) {
    console.error('MGR Staff Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.2 Staff Performance
exports.getStaffPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, role: { select: { name: true } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const completedHKTasks = await prisma.housekeepingTask.count({ where: { assigned_to_user_id: userId, status: 'Completed' } });
    const completedBBTasks = await prisma.bellboyTask.count({ where: { assigned_to_user_id: userId, status: 'Completed' } });
    const collectedPayments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { collected_by_user_id: userId, status: 'Completed' }
    });
    const avgRating = await prisma.bellboyTask.aggregate({
      _avg: { guest_rating: true },
      where: { assigned_to_user_id: userId, guest_rating: { not: null } }
    });

    res.json({
      user,
      completedHKTasks,
      completedBBTasks,
      totalPaymentsCollected: collectedPayments._sum.amount || 0,
      averageGuestRating: avgRating._avg.guest_rating || null
    });
  } catch (error) {
    console.error('MGR Performance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.2 Staff Performance (bulk list, for Staff.jsx overview table)
exports.getStaffPerformanceList = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { status: 'Active' },
      select: { id: true, full_name: true, role: { select: { name: true } } }
    });

    const results = await Promise.all(staff.map(async (u) => {
      const [hkCount, bbCount, avgRating] = await Promise.all([
        prisma.housekeepingTask.count({ where: { assigned_to_user_id: u.id, status: 'Completed' } }),
        prisma.bellboyTask.count({ where: { assigned_to_user_id: u.id, status: 'Completed' } }),
        prisma.bellboyTask.aggregate({ _avg: { guest_rating: true }, where: { assigned_to_user_id: u.id, guest_rating: { not: null } } })
      ]);
      return {
        id: u.id,
        name: u.full_name,
        role: u.role.name,
        tasks_completed: hkCount + bbCount,
        avg_rating: avgRating._avg.guest_rating
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('MGR StaffPerformanceList Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.3 Room Performance Analytics
exports.getRoomPerformanceAnalytics = async (req, res) => {
  try {
    const roomTypes = await prisma.roomType.findMany({
      include: {
        rooms: {
          include: { bookings: { where: { status: { in: ['Active', 'Completed'] } }, select: { total_price: true } } }
        }
      }
    });

    const analytics = roomTypes.map(rt => ({
      roomType: rt.name,
      totalRooms: rt.rooms.length,
      totalRevenue: rt.rooms.reduce((sum, r) => sum + r.bookings.reduce((s, b) => s + b.total_price, 0), 0),
      totalBookings: rt.rooms.reduce((sum, r) => sum + r.bookings.length, 0)
    }));

    res.json(analytics);
  } catch (error) {
    console.error('MGR RoomPerf Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.4 Get Bookings
exports.getBookings = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from);
      if (to) where.created_at.lte = new Date(to);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        guest: { select: { id: true, full_name: true, phone: true } },
        room: { include: { room_type: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('MGR Bookings Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.4 Cancel Booking (manager override)
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_code } = req.params;

    const booking = await prisma.booking.findUnique({ where: { booking_code } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.source === 'BookingCom' && booking.payment_model === 'booking_com_collect') {
      return res.status(403).json({ error: 'This reservation was paid via Booking.com and can only be cancelled from Booking.com' });
    }
    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot cancel booking with status '${booking.status}'` });
    }

    // Status o'zgarishi, DELETE emas
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'Cancelled' }
    });

    // Agar xona band bo'lsa, bo'shatamiz
    if (booking.status === 'Active') {
      await prisma.room.update({
        where: { id: booking.room_id },
        data: { reception_status: 'Cleaning', housekeeping_status: 'VacantDirty' }
      });
      req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: booking.room_id, status: 'Cleaning' });
    }

    // AuditLog
    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'BOOKING_CANCELLED_BY_MANAGER',
        entity_type: 'Booking',
        entity_id: booking.id,
        metadata: toJson({ booking_code, previous_status: booking.status })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('MGR CancelBooking Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.5 Get Lost Items
exports.getLostItems = async (req, res) => {
  try {
    const items = await prisma.lostFoundItem.findMany({
      include: {
        room: { select: { room_number: true, floor: true } },
        finder: { select: { full_name: true } }
      },
      orderBy: { id: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error('MGR LostItems Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.5 Return Lost Item
exports.returnLostItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.lostFoundItem.findUnique({ where: { id: parseInt(id) } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status === 'Returned') return res.status(400).json({ error: 'Already returned' });

    const updated = await prisma.lostFoundItem.update({
      where: { id: parseInt(id) },
      data: { status: 'Returned', returned_at: new Date() }
    });
    res.json(updated);
  } catch (error) {
    console.error('MGR ReturnItem Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Rooms list (for the "report a new issue" room picker)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ include: { room_type: true }, orderBy: { room_number: 'asc' } });
    res.json(rooms);
  } catch (error) {
    console.error('MGR GetRooms Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Quick room block/unblock (Out of Order) — Manager-level shortcut, same effect as Admin's Rooms page
exports.updateRoomStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reception_status } = req.body;
    if (!['Available', 'Maintenance'].includes(reception_status)) {
      return res.status(400).json({ error: 'reception_status must be Available or Maintenance' });
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.reception_status === 'Occupied' && reception_status === 'Maintenance') {
      return res.status(400).json({ error: 'Cannot block an occupied room — check the guest out first' });
    }

    const updated = await prisma.room.update({ where: { id }, data: { reception_status } });
    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: id, status: reception_status });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: reception_status === 'Maintenance' ? 'ROOM_BLOCKED' : 'ROOM_UNBLOCKED', entity_type: 'Room', entity_id: id }
    });

    res.json(updated);
  } catch (error) {
    console.error('MGR UpdateRoomStatus Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Report a new Maintenance issue (previously only assign/resolve existed — nothing could create one)
exports.createMaintenanceRequest = async (req, res) => {
  try {
    const room_id = parseInt(req.body.room_id);
    const { description, photo_url } = req.body;
    if (!room_id || !description) {
      return res.status(400).json({ error: 'room_id and description are required' });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        room_id,
        description,
        photo_url: photo_url || null,
        reported_by_user_id: req.user.userId,
        status: 'New'
      },
      include: { room: { select: { room_number: true, floor: true } }, reporter: { select: { full_name: true } } }
    });

    req.io.to('housekeeping-updates').to('reception-updates').emit('maintenance-request-created', { roomId: room_id, description });

    res.status(201).json(request);
  } catch (error) {
    console.error('MGR CreateMaintenance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Get Maintenance Requests
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        room: { select: { room_number: true, floor: true } },
        reporter: { select: { full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('MGR Maintenance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Assign Maintenance Request
exports.assignMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to_user_id, assigned_to } = req.body;

    // Build update data — prefer user ID (proper FK), fallback to name string
    const data = { status: 'InProgress' };
    if (assigned_to_user_id) {
      data.assigned_to_user_id = parseInt(assigned_to_user_id);
      // Also set name for display convenience
      const usta = await prisma.user.findUnique({ where: { id: parseInt(assigned_to_user_id) }, select: { full_name: true } });
      if (usta) data.assigned_to = usta.full_name;
    } else if (assigned_to) {
      data.assigned_to = assigned_to;
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data,
      include: { room: { select: { room_number: true } } }
    });

    // Emit socket notification to assigned usta
    if (req.io && assigned_to_user_id) {
      req.io.to(`user-${assigned_to_user_id}`).emit('new-maintenance-assigned', {
        message: `Xona ${updated.room?.room_number}: yangi vazifa tayinlandi`,
        request: updated
      });
      req.io.to('manager-updates').emit('maintenance-updated', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error('MGR AssignMaint Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.6 Resolve Maintenance Request
exports.resolveMaintenanceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'Resolved', resolved_at: new Date() }
    });

    // Xonani qaytadan Cleaning holatiga
    await prisma.room.update({
      where: { id: request.room_id },
      data: { reception_status: 'Cleaning', housekeeping_status: 'VacantDirty' }
    });

    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: request.room_id, status: 'Cleaning' });

    res.json(updated);
  } catch (error) {
    console.error('MGR ResolveMaint Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.7 Daily Reports
exports.getDailyReports = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [checkIns, checkOuts, revenue, newBookings] = await Promise.all([
      prisma.booking.count({ where: { status: 'Active', check_in_date: { gte: today, lt: tomorrow } } }),
      prisma.booking.count({ where: { status: 'Completed', check_out_date: { gte: today, lt: tomorrow } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Completed', created_at: { gte: today, lt: tomorrow } } }),
      prisma.booking.count({ where: { created_at: { gte: today, lt: tomorrow } } })
    ]);

    res.json({ date: today.toISOString().split('T')[0], checkIns, checkOuts, revenue: revenue._sum.amount || 0, newBookings });
  } catch (error) {
    console.error('MGR DailyReport Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.7 Monthly Reports
exports.getMonthlyReports = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const [totalBookings, completedBookings, revenue, cancellations] = await Promise.all([
      prisma.booking.count({ where: { created_at: { gte: start, lt: end } } }),
      prisma.booking.count({ where: { status: 'Completed', check_out_date: { gte: start, lt: end } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Completed', created_at: { gte: start, lt: end } } }),
      prisma.booking.count({ where: { status: 'Cancelled', created_at: { gte: start, lt: end } } })
    ]);

    res.json({ year: y, month: m, totalBookings, completedBookings, cancellations, revenue: revenue._sum.amount || 0 });
  } catch (error) {
    console.error('MGR MonthlyReport Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.8 List Seasonal Rates
exports.getSeasonalRates = async (req, res) => {
  try {
    const rates = await prisma.seasonalRate.findMany({
      include: { room_type: { select: { name: true, base_price: true } } },
      orderBy: { start_date: 'asc' }
    });
    res.json(rates);
  } catch (error) {
    console.error('MGR GetRates Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.8 Update Rates (SeasonalRate)
exports.updateRates = async (req, res) => {
  try {
    const { room_type_id, start_date, end_date, price_override } = req.body;

    const roomType = await prisma.roomType.findUnique({ where: { id: room_type_id } });
    if (!roomType) return res.status(404).json({ error: 'Room type not found' });

    const rate = await prisma.seasonalRate.create({
      data: { room_type_id, start_date: new Date(start_date), end_date: new Date(end_date), price_override: parseFloat(price_override) }
    });

    res.status(201).json(rate);
  } catch (error) {
    console.error('MGR Rates Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.8 Delete a Seasonal Rate override
exports.deleteSeasonalRate = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.seasonalRate.delete({ where: { id } });
    res.json({ message: 'Seasonal rate removed' });
  } catch (error) {
    console.error('MGR DeleteRate Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4.9 Get all Usta (maintenance technician) users for assignment dropdown
exports.getUstaUsers = async (req, res) => {
  try {
    const ustaRole = await prisma.role.findUnique({ where: { name: 'Usta' } });
    if (!ustaRole) return res.json([]);
    const users = await prisma.user.findMany({
      where: { role_id: ustaRole.id, status: 'Active' },
      select: { id: true, full_name: true, email: true }
    });
    res.json(users);
  } catch (error) {
    console.error('MGR GetUstaUsers Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

