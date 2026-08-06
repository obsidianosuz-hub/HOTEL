const prisma = require('../utils/prismaClient');
const { toJson, fromJson } = require('../utils/jsonHelper');

// 2.1 Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const pendingTasks = await prisma.housekeepingTask.count({ where: { status: 'Pending' } });
    const inProgressTasks = await prisma.housekeepingTask.count({ where: { status: 'InProgress' } });
    const completedToday = await prisma.housekeepingTask.count({
      where: {
        status: 'Completed',
        completed_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });
    const dirtyRooms = await prisma.room.count({ where: { housekeeping_status: { in: ['VacantDirty', 'OccupiedDirty'] } } });
    const outOfService = await prisma.room.count({ where: { housekeeping_status: 'OutOfService' } });

    res.json({ pendingTasks, inProgressTasks, completedToday, dirtyRooms, outOfService });
  } catch (error) {
    console.error('HK Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.2 Get Tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.housekeepingTask.findMany({
      where,
      include: { room: { include: { room_type: true } }, assignee: { select: { id: true, full_name: true } } },
      orderBy: [{ priority: 'asc' }, { created_at: 'desc' }]
    });
    res.json(tasks);
  } catch (error) {
    console.error('HK GetTasks Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.2 Start Task
exports.startTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.housekeepingTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot start task with status '${task.status}'` });
    }

    const updated = await prisma.housekeepingTask.update({
      where: { id: parseInt(id) },
      data: { status: 'InProgress' }
    });
    res.json(updated);
  } catch (error) {
    console.error('HK StartTask Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.2 Complete Task
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { force, after_photo_url } = req.body;

    const task = await prisma.housekeepingTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status === 'Completed') return res.status(400).json({ error: 'Task already completed' });

    // Business Rule: checklist to'liq emasligini tekshirish
    const checklist = task.checklist ? fromJson(task.checklist) : [];
    if (Array.isArray(checklist) && checklist.length > 0) {
      const incomplete = checklist.filter(item => !item.done);
      if (incomplete.length > 0 && !force) {
        return res.status(422).json({
          warning: 'Checklist is not fully completed',
          incompleteItems: incomplete,
          hint: 'Send force=true to complete anyway'
        });
      }
    }

    const updated = await prisma.housekeepingTask.update({
      where: { id: parseInt(id) },
      data: { status: 'Completed', completed_at: new Date(), after_photo_url }
    });

    // Update room to VacantClean and Available
    await prisma.room.update({
      where: { id: task.room_id },
      data: { housekeeping_status: 'VacantClean', reception_status: 'Available' }
    });

    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: task.room_id, status: 'Available', housekeepingStatus: 'VacantClean' });

    res.json(updated);
  } catch (error) {
    console.error('HK CompleteTask Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.2 Mark Issues → MaintenanceRequest yaratadi
exports.markIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, photo_url } = req.body;

    const task = await prisma.housekeepingTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        room_id: task.room_id,
        reported_by_user_id: req.user.userId,
        description,
        photo_url
      }
    });

    // Xonani Maintenance holatiga o'tkazish
    await prisma.room.update({
      where: { id: task.room_id },
      data: { reception_status: 'Maintenance', housekeeping_status: 'OutOfService' }
    });

    req.io.emit('new-maintenance-request', { request: maintenanceRequest, roomId: task.room_id });
    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: task.room_id, status: 'Maintenance' });

    res.status(201).json(maintenanceRequest);
  } catch (error) {
    console.error('HK MarkIssues Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.3 Update Room Status (tozalik)
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { housekeeping_status } = req.body;

    const validStatuses = ['VacantClean', 'VacantDirty', 'OccupiedClean', 'OccupiedDirty', 'OutOfService'];
    if (!validStatuses.includes(housekeeping_status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data: { housekeeping_status }
    });

    req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', { roomId: room.id, housekeepingStatus: housekeeping_status });

    res.json(room);
  } catch (error) {
    console.error('HK UpdateRoom Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.3 Get all rooms (grid view)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { room_type: true },
      orderBy: { room_number: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('HK GetRooms Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.4 Get rooms by floor
exports.getRoomsByFloor = async (req, res) => {
  try {
    const { floor } = req.params;
    const rooms = await prisma.room.findMany({
      where: { floor: parseInt(floor) },
      include: { room_type: true },
      orderBy: { room_number: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('HK RoomsByFloor Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.5 Get Lost Items
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
    console.error('HK GetLostItems Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.5 Report Lost Item
exports.reportLostItem = async (req, res) => {
  try {
    const { room_id, description } = req.body;
    let photo_url = null;

    if (req.file) {
      photo_url = `/uploads/lost-found/${req.file.filename}`;
    }

    const item = await prisma.lostFoundItem.create({
      data: {
        room_id: room_id ? parseInt(room_id) : null,
        description,
        photo_url,
        found_by_user_id: req.user.userId
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('HK LostItem Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.6 Request Supplies → Procurement ga yo'naladi
exports.getSupplyItems = async (req, res) => {
  try {
    const items = await prisma.supplyItem.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    console.error('HK Supply Items Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.requestSupplies = async (req, res) => {
  try {
    const { supply_item_id, custom_item, quantity } = req.body;

    if (supply_item_id) {
      const supplyItem = await prisma.supplyItem.findUnique({ where: { id: supply_item_id } });
      if (!supplyItem) return res.status(404).json({ error: 'Supply item not found' });
    }

    if (!supply_item_id && !custom_item) {
      return res.status(400).json({ error: 'Must provide either an item ID or a custom item description' });
    }

    const request = await prisma.supplyRequest.create({
      data: {
        supply_item_id: supply_item_id || null,
        custom_item: custom_item || null,
        requested_by_user_id: req.user.userId,
        quantity: parseInt(quantity, 10) || 1
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('HK Supplies Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.7 Reports
exports.getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const completedTasks = await prisma.housekeepingTask.findMany({
      where: {
        status: 'Completed',
        ...(from || to ? { completed_at: dateFilter } : {})
      },
      include: { room: true, assignee: { select: { id: true, full_name: true } } }
    });

    const maintenanceCount = await prisma.maintenanceRequest.count({
      where: from || to ? { created_at: dateFilter } : {}
    });

    res.json({ completedTasks, totalCompleted: completedTasks.length, maintenanceCount });
  } catch (error) {
    console.error('HK Reports Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.8 Get Staff (supervisor only)
exports.getStaff = async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { name: { in: ['Housekeeping', 'HousekeepingSupervisor'] } }, status: 'Active' },
      select: {
        id: true, full_name: true, email: true, phone: true,
        role: { select: { name: true } },
        housekeeping_tasks: { where: { status: { not: 'Completed' } }, select: { id: true, status: true } }
      }
    });
    res.json(staff);
  } catch (error) {
    console.error('HK Staff Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2.8 Reassign Task
exports.reassignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to_user_id } = req.body;

    const task = await prisma.housekeepingTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status === 'Completed') return res.status(400).json({ error: 'Cannot reassign completed task' });

    const updated = await prisma.housekeepingTask.update({
      where: { id: parseInt(id) },
      data: { assigned_to_user_id, status: 'Pending' }
    });

    res.json(updated);
  } catch (error) {
    console.error('HK Reassign Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Housekeeping: Nosozlik bildirish (Manager va Usta panellariga real-time xabar boradi)
exports.reportMaintenanceIssue = async (req, res) => {
  try {
    const { room_id, description } = req.body;
    if (!room_id || !description) {
      return res.status(400).json({ error: 'room_id va description majburiy' });
    }

    const roomId = parseInt(room_id);
    const room = await prisma.room.findUnique({ where: { id: roomId }, select: { room_number: true } });
    if (!room) return res.status(404).json({ error: 'Xona topilmadi' });

    // MaintenanceRequest yaratish
    const request = await prisma.maintenanceRequest.create({
      data: {
        room_id: roomId,
        description,
        reported_by_user_id: req.user.userId,
        status: 'New'
      },
      include: {
        room: { select: { room_number: true, floor: true } },
        reporter: { select: { full_name: true } }
      }
    });

    // Manager va Usta paneliga real-time bildirishnoma
    req.io.to('manager-updates').to('usta-updates').emit('maintenance-request-created', {
      requestId: request.id,
      roomNumber: room.room_number,
      description,
      reporterName: request.reporter?.full_name,
      createdAt: request.created_at
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('HK ReportMaintenance Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

