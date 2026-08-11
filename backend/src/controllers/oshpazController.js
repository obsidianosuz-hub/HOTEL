const prisma = require('../utils/prismaClient');

// Get kitchen orders (GuestRequests with type 'RoomService' or 'FoodOrder')
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {
      request_type: { in: ['RoomService', 'FoodOrder', 'Food'] }
    };
    if (status && status !== 'All') where.status = status;

    const orders = await prisma.guestRequest.findMany({
      where,
      include: {
        guest: { select: { full_name: true, phone: true } },
        room: { select: { room_number: true, floor: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('OSHPAZ GetOrders Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard stats for Oshpaz
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const foodTypes = { in: ['RoomService', 'FoodOrder', 'Food'] };

    const [totalToday, pending, completed, recentOrders] = await Promise.all([
      prisma.guestRequest.count({
        where: { request_type: foodTypes, created_at: { gte: today, lt: tomorrow } }
      }),
      prisma.guestRequest.count({
        where: { request_type: foodTypes, status: 'Pending' }
      }),
      prisma.guestRequest.count({
        where: { request_type: foodTypes, status: 'Completed', created_at: { gte: today, lt: tomorrow } }
      }),
      prisma.guestRequest.findMany({
        where: { request_type: foodTypes, status: { in: ['Pending', 'Accepted'] } },
        include: {
          guest: { select: { full_name: true } },
          room: { select: { room_number: true } }
        },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    ]);

    res.json({ totalToday, pending, completed, recentOrders });
  } catch (error) {
    console.error('OSHPAZ Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update order status: Pending → Accepted → Completed
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Accepted', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'status must be Accepted or Completed' });
    }

    const order = await prisma.guestRequest.findUnique({ where: { id: parseInt(id) } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.guestRequest.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        guest: { select: { full_name: true } },
        room: { select: { room_number: true } }
      }
    });

    // Notify reception that a guest order was updated
    req.io.to('reception-updates').emit('guest-request-updated', {
      requestId: updated.id,
      status: updated.status,
      roomNumber: updated.room?.room_number
    });

    res.json(updated);
  } catch (error) {
    console.error('OSHPAZ UpdateOrder Error:', error);
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
    console.error('Oshpaz GetSupplyItems Error:', error);
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
    console.error('Oshpaz RequestSupplies Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const menuModel = require('../models/menuModel');

// ------------------------------------------------------
// MENU MANAGEMENT
// ------------------------------------------------------

exports.getMenu = (req, res) => {
  try {
    const menu = menuModel.getAll();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createMenuItem = (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;
    const newItem = menuModel.create({ name, description, price, category, image_url, is_available });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateMenuItem = (req, res) => {
  try {
    const id = req.params.id;
    const updatedItem = menuModel.update(id, req.body);
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteMenuItem = (req, res) => {
  try {
    const id = req.params.id;
    const success = menuModel.delete(id);
    if (!success) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
