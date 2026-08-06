const prisma = require('../utils/prismaClient');

// Get all maintenance requests assigned to the logged-in Usta
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { status } = req.query;
    const where = { assigned_to: user.full_name };
    if (status && status !== 'All') where.status = status;

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
    console.error('USTA GetRequests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get stats summary for Usta dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const assignedName = user.full_name;

    const [total, inProgress, resolved, newRequests] = await Promise.all([
      prisma.maintenanceRequest.count({ where: { assigned_to: assignedName } }),
      prisma.maintenanceRequest.count({ where: { assigned_to: assignedName, status: 'InProgress' } }),
      prisma.maintenanceRequest.count({ where: { assigned_to: assignedName, status: 'Resolved' } }),
      prisma.maintenanceRequest.count({ where: { assigned_to: assignedName, status: 'New' } })
    ]);

    // Recent 5 active requests
    const recentRequests = await prisma.maintenanceRequest.findMany({
      where: { assigned_to: assignedName, status: { in: ['New', 'InProgress'] } },
      include: { room: { select: { room_number: true, floor: true } } },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    res.json({ total, inProgress, resolved, newRequests, recentRequests });
  } catch (error) {
    console.error('USTA Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update maintenance request status (InProgress or Resolved)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!['InProgress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be InProgress or Resolved' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const request = await prisma.maintenanceRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Only own (assigned) requests can be updated by Usta
    if (request.assigned_to !== user.full_name) {
      return res.status(403).json({ error: 'Forbidden: This request is not assigned to you' });
    }

    const updateData = { status };
    if (status === 'Resolved') {
      updateData.resolved_at = new Date();
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { room: { select: { room_number: true, floor: true } } }
    });

    // If resolved, put room into Cleaning status
    if (status === 'Resolved') {
      await prisma.room.update({
        where: { id: request.room_id },
        data: { reception_status: 'Cleaning', housekeeping_status: 'VacantDirty' }
      });
      req.io.to('reception-updates').to('housekeeping-updates').emit('room-status-changed', {
        roomId: request.room_id,
        status: 'Cleaning'
      });
    }

    // Notify manager that a request status changed
    req.io.to('manager-updates').emit('maintenance-status-changed', {
      requestId: updated.id,
      status: updated.status,
      roomNumber: updated.room?.room_number
    });

    res.json(updated);
  } catch (error) {
    console.error('USTA UpdateStatus Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSupplyItems = async (req, res) => {
  try {
    const items = await prisma.supplyItem.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Usta GetSupplyItems Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.requestSupplies = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const requests = [];
    for (const item of items) {
      if (item.custom_item) {
        requests.push({
          custom_item: item.custom_item,
          quantity: item.quantity,
          requested_by_user_id: req.user.userId,
          status: 'Pending'
        });
      } else if (item.supply_item_id) {
        requests.push({
          supply_item_id: parseInt(item.supply_item_id),
          quantity: item.quantity,
          requested_by_user_id: req.user.userId,
          status: 'Pending'
        });
      }
    }

    await prisma.supplyRequest.createMany({
      data: requests
    });

    req.io.to('procurement-updates').emit('new-supply-request', { count: requests.length });

    res.status(201).json({ message: 'Supplies requested successfully' });
  } catch (error) {
    console.error('Usta RequestSupplies Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
