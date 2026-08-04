const prisma = require('../utils/prismaClient');
const { randomBytes } = require('crypto');

const generateTagId = () => `LTG-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

// 3.1 Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const assignedTasks = await prisma.bellboyTask.count({ where: { assigned_to_user_id: userId, status: { in: ['Assigned', 'Accepted'] } } });
    const inProgress = await prisma.bellboyTask.count({ where: { assigned_to_user_id: userId, status: 'InProgress' } });
    const completedToday = await prisma.bellboyTask.count({
      where: {
        assigned_to_user_id: userId,
        status: 'Completed',
        completed_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });
    const pendingGuestRequests = await prisma.guestRequest.count({ where: { status: 'Pending' } });

    res.json({ assignedTasks, inProgress, completedToday, pendingGuestRequests });
  } catch (error) {
    console.error('BB Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.2 Get Tasks
exports.getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.userId;
    const where = { assigned_to_user_id: userId };
    if (status) where.status = status;

    const tasks = await prisma.bellboyTask.findMany({
      where,
      include: {
        guest: { select: { id: true, full_name: true, phone: true } },
        room: { select: { id: true, room_number: true, floor: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    // 3.5 completed filter is handled by ?status=Completed query param
    res.json(tasks);
  } catch (error) {
    console.error('BB GetTasks Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.2 Start Task
exports.startTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.bellboyTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.assigned_to_user_id !== req.user.userId) return res.status(403).json({ error: 'Not assigned to you' });
    if (task.status !== 'Assigned' && task.status !== 'Accepted') {
      return res.status(400).json({ error: `Cannot start task with status '${task.status}'` });
    }

    const updated = await prisma.bellboyTask.update({
      where: { id: parseInt(id) },
      data: { status: 'InProgress', started_at: new Date() }
    });
    res.json(updated);
  } catch (error) {
    console.error('BB StartTask Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.2 Complete Task
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_rating } = req.body;

    const task = await prisma.bellboyTask.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'InProgress') return res.status(400).json({ error: 'Task must be InProgress to complete' });

    const updated = await prisma.bellboyTask.update({
      where: { id: parseInt(id) },
      data: { status: 'Completed', completed_at: new Date(), guest_rating: guest_rating || null }
    });
    res.json(updated);
  } catch (error) {
    console.error('BB CompleteTask Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.3 Get Guest Requests
exports.getGuestRequests = async (req, res) => {
  try {
    const requests = await prisma.guestRequest.findMany({
      where: { status: { in: ['Pending', 'Accepted'] } },
      include: {
        guest: { select: { id: true, full_name: true, phone: true } },
        room: { select: { id: true, room_number: true, floor: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('BB GuestRequests Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.3 Accept Guest Request
exports.acceptGuestRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.guestRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot accept request with status '${request.status}'` });
    }

    const updated = await prisma.guestRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'Accepted' }
    });
    res.json(updated);
  } catch (error) {
    console.error('BB AcceptRequest Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.3 Complete Guest Request
exports.completeGuestRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.guestRequest.findUnique({ where: { id: parseInt(id) } });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const updated = await prisma.guestRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'Completed' }
    });
    res.json(updated);
  } catch (error) {
    console.error('BB CompleteRequest Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.4 Get Luggage
exports.getLuggage = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const luggage = await prisma.luggageItem.findMany({
      where,
      include: { guest: { select: { id: true, full_name: true, phone: true } } },
      orderBy: { stored_at: 'desc' }
    });
    res.json(luggage);
  } catch (error) {
    console.error('BB GetLuggage Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.4 Store Luggage
exports.storeLuggage = async (req, res) => {
  try {
    const { guest_id, description } = req.body;

    const guest = await prisma.guest.findUnique({ where: { id: guest_id } });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    const luggage = await prisma.luggageItem.create({
      data: {
        tag_id: generateTagId(),
        guest_id,
        description
      }
    });

    res.status(201).json(luggage);
  } catch (error) {
    console.error('BB StoreLuggage Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3.4 Deliver Luggage
exports.deliverLuggage = async (req, res) => {
  try {
    const { id } = req.params;

    const luggage = await prisma.luggageItem.findUnique({ where: { id: parseInt(id) } });
    if (!luggage) return res.status(404).json({ error: 'Luggage not found' });
    if (luggage.status === 'Delivered') return res.status(400).json({ error: 'Already delivered' });

    const updated = await prisma.luggageItem.update({
      where: { id: parseInt(id) },
      data: { status: 'Delivered', delivered_at: new Date() }
    });
    res.json(updated);
  } catch (error) {
    console.error('BB DeliverLuggage Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
