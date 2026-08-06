const prisma = require('../utils/prismaClient');
const { randomBytes } = require('crypto');

const generatePONumber = () => `PO-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

// 5.1 Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const pendingPOs = await prisma.purchaseOrder.count({ where: { status: 'Pending' } });
    const pendingInvoices = await prisma.invoice.count({ where: { status: 'Pending' } });
    const allInventory = await prisma.inventoryItem.findMany();
    const lowStock = allInventory.filter(item => item.current_quantity <= item.min_level);
    const activeVendors = await prisma.vendor.count({ where: { status: 'Active' } });
    const pendingSupplyRequests = await prisma.supplyRequest.count({ where: { status: 'Pending' } });

    res.json({ pendingPOs, pendingInvoices, lowStockCount: lowStock.length, activeVendors, pendingSupplyRequests });
  } catch (error) {
    console.error('PROC Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.2 Create Vendor
exports.createVendor = async (req, res) => {
  try {
    const { name, category, contact_info, rating } = req.body;
    const vendor = await prisma.vendor.create({
      data: { name, category, contact_info, rating }
    });
    if (req.io) req.io.to('procurement-updates').emit('procurement-vendor-created', vendor);
    res.status(201).json(vendor);
  } catch (error) {
    console.error('PROC CreateVendor Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSupplyRequests = async (req, res) => {
  try {
    const requests = await prisma.supplyRequest.findMany({
      include: {
        supply_item: true,
        requester: { select: { full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.fulfillSupplyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.supplyRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'Fulfilled' }
    });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.2 Update Vendor
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, contact_info, rating, status } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data: { name, category, contact_info, rating, status }
    });
    if (req.io) req.io.to('procurement-updates').emit('procurement-vendor-updated', vendor);
    res.json(vendor);
  } catch (error) {
    console.error('PROC UpdateVendor Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.3 Create Purchase Order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { vendor_id, items } = req.body;
    // items: [{product_name, quantity, unit, unit_price}]

    const vendor = await prisma.vendor.findUnique({ where: { id: vendor_id } });
    if (!vendor || vendor.status !== 'Active') return res.status(400).json({ error: 'Vendor not found or inactive' });

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: generatePONumber(),
        vendor_id,
        created_by_user_id: req.user.userId,
        items: {
          create: items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price
          }))
        }
      },
      include: { items: true }
    });

    if (req.io) req.io.to('procurement-updates').emit('procurement-po-created', po);
    res.status(201).json(po);
  } catch (error) {
    console.error('PROC CreatePO Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.3 / 5.5 Receive Purchase Order
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    if (po.status === 'Received') return res.status(400).json({ error: 'PO already received' });

    // Update PO status
    await prisma.purchaseOrder.update({
      where: { id: parseInt(id) },
      data: { status: 'Received' }
    });

    // Update Inventory for each item
    for (const item of po.items) {
      const existing = await prisma.inventoryItem.findFirst({ where: { name: item.product_name } });
      if (existing) {
        await prisma.inventoryItem.update({
          where: { id: existing.id },
          data: { current_quantity: { increment: item.quantity } }
        });
      } else {
        await prisma.inventoryItem.create({
          data: {
            name: item.product_name,
            category: 'General',
            current_quantity: item.quantity,
            min_level: 5,
            max_level: 100
          }
        });
      }
    }

    // Auto-create Invoice
    const totalAmount = po.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const invoice = await prisma.invoice.create({
      data: {
        vendor_id: po.vendor_id,
        purchase_order_id: po.id,
        amount: totalAmount,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 kun keyin
      }
    });

    if (req.io) req.io.to('procurement-updates').emit('procurement-po-received', { poId: parseInt(id), invoice });
    res.json({ message: 'PO received and inventory updated', invoice });
  } catch (error) {
    console.error('PROC ReceivePO Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.4 Get Inventory
exports.getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' } });
    // Flag low stock
    const withFlags = inventory.map(item => ({
      ...item,
      isLowStock: item.current_quantity <= item.min_level
    }));
    res.json(withFlags);
  } catch (error) {
    console.error('PROC Inventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.4 Create Inventory Item
exports.createInventoryItem = async (req, res) => {
  try {
    const { name, category, current_quantity, min_level, max_level } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category: category || 'General',
        current_quantity: current_quantity ?? 0,
        min_level: min_level ?? 5,
        max_level: max_level ?? 100
      }
    });
    if (req.io) req.io.to('procurement-updates').emit('procurement-inventory-created', item);
    res.status(201).json(item);
  } catch (error) {
    console.error('PROC CreateInventory Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.4 Reorder single Inventory item (one-click, from item row)
exports.reorderInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id) } });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    const vendor = await prisma.vendor.findFirst({ where: { status: 'Active' } });
    if (!vendor) return res.status(400).json({ error: 'No active vendor available for reorder' });

    const quantity = Math.max(item.max_level - item.current_quantity, item.min_level, 1);

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: generatePONumber(),
        vendor_id: vendor.id,
        created_by_user_id: req.user.userId,
        items: { create: [{ product_name: item.name, quantity, unit: 'pcs', unit_price: 0 }] }
      },
      include: { items: true }
    });

    if (req.io) req.io.to('procurement-updates').emit('procurement-inventory-reordered', po);
    res.status(201).json({ message: 'Reorder PO created', po });
  } catch (error) {
    console.error('PROC ReorderItem Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.4 Reorder Inventory
exports.reorderInventory = async (req, res) => {
  try {
    const { item_id, vendor_id, quantity } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id: item_id } });
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });

    // Auto-create PO for reorder
    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: generatePONumber(),
        vendor_id,
        created_by_user_id: req.user.userId,
        items: {
          create: [{ product_name: item.name, quantity, unit: 'pcs', unit_price: 0 }]
        }
      },
      include: { items: true }
    });

    if (req.io) req.io.to('procurement-updates').emit('procurement-inventory-reordered', po);
    res.status(201).json({ message: 'Reorder PO created', po });
  } catch (error) {
    console.error('PROC Reorder Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.6 Approve Invoice
exports.approveInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(id) } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'Pending') return res.status(400).json({ error: `Cannot approve invoice with status '${invoice.status}'` });

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status: 'Approved' }
    });
    if (req.io) req.io.to('procurement-updates').emit('procurement-invoice-approved', updated);
    res.json(updated);
  } catch (error) {
    console.error('PROC ApproveInv Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.6 Reject Invoice
exports.rejectInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(id) } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const updated = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: { status: 'Rejected', rejection_reason }
    });
    if (req.io) req.io.to('procurement-updates').emit('procurement-invoice-rejected', updated);
    res.json(updated);
  } catch (error) {
    console.error('PROC RejectInv Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.7 Process Payment (Vendor Payment)
exports.processPayment = async (req, res) => {
  try {
    const { invoice_id, amount, method } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id: invoice_id } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status !== 'Approved') return res.status(400).json({ error: 'Invoice must be approved before payment' });

    const payment = await prisma.vendorPayment.create({
      data: { invoice_id, amount, method }
    });

    // Update invoice status to Paid
    await prisma.invoice.update({
      where: { id: invoice_id },
      data: { status: 'Paid' }
    });

    if (req.io) req.io.to('procurement-updates').emit('procurement-payment-processed', payment);
    res.status(201).json(payment);
  } catch (error) {
    console.error('PROC Payment Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5.8 Reports
exports.getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const [totalPOs, receivedPOs, totalSpent, pendingInvoiceAmount] = await Promise.all([
      prisma.purchaseOrder.count({ where: from || to ? { created_at: dateFilter } : {} }),
      prisma.purchaseOrder.count({ where: { status: 'Received', ...(from || to ? { created_at: dateFilter } : {}) } }),
      prisma.vendorPayment.aggregate({ _sum: { amount: true }, where: from || to ? { paid_at: dateFilter } : {} }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'Pending' } })
    ]);

    res.json({
      totalPOs,
      receivedPOs,
      totalSpent: totalSpent._sum.amount || 0,
      pendingInvoiceAmount: pendingInvoiceAmount._sum.amount || 0
    });
  } catch (error) {
    console.error('PROC Reports Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
