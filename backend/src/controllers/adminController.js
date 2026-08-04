const prisma = require('../utils/prismaClient');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { parse: parseCsv } = require('csv-parse/sync');
const { toJson, fromJson } = require('../utils/jsonHelper');
const cryptoHelper = require('../utils/cryptoHelper');
const bookingComWebhookController = require('./bookingComWebhookController');

// 6.1 Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'Active' } });
    const totalGuests = await prisma.guest.count();
    const totalBookings = await prisma.booking.count();
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'Completed' }
    });
    const totalRooms = await prisma.room.count();

    res.json({
      totalUsers,
      activeUsers,
      totalGuests,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRooms
    });
  } catch (error) {
    console.error('ADM Dashboard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.1 System Health
exports.getSystemHealth = async (req, res) => {
  try {
    // Simple health check — DB connection
    await prisma.$queryRawUnsafe('SELECT 1');
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
};

// 6.2 Get Users (list)
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, full_name: true, email: true, phone: true, status: true, created_at: true,
        role_id: true, role: { select: { id: true, name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('ADM GetUsers Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.2 Create User
exports.createUser = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    const role_id = parseInt(req.body.role_id);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const role = await prisma.role.findUnique({ where: { id: role_id } });
    if (!role) return res.status(400).json({ error: 'Invalid role_id' });

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { full_name, email, phone, password_hash, role_id },
      select: { id: true, full_name: true, email: true, phone: true, status: true, role: { select: { name: true } } }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'USER_CREATED',
        entity_type: 'User',
        entity_id: user.id,
        metadata: toJson({ email, role: role.name })
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('ADM CreateUser Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.2 Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, status, password } = req.body;
    const role_id = req.body.role_id !== undefined && req.body.role_id !== '' ? parseInt(req.body.role_id) : undefined;

    const data = { full_name, email, phone, role_id, status };
    if (password) {
      data.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, full_name: true, email: true, phone: true, status: true, role: { select: { name: true } } }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'USER_UPDATED',
        entity_type: 'User',
        entity_id: parseInt(id),
        metadata: toJson({ changes: req.body })
      }
    });

    res.json(user);
  } catch (error) {
    console.error('ADM UpdateUser Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.2 Delete User (faqat xodim, moliyaviy yozuvlar emas)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Soft-delete: set Inactive instead of actual DELETE (preserving audit trail)
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'Inactive' }
    });

    // Send force-logout socket event to the deactivated user
    req.io.to(`user-${userId}`).emit('force-logout');

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'USER_DEACTIVATED',
        entity_type: 'User',
        entity_id: userId,
        metadata: toJson({ deactivated_user_email: user.email })
      }
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('ADM DeleteUser Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.3 Get Roles (with permissions, for Roles & Permissions screen)
exports.getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('ADM GetRoles Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.3 Update Role Permissions
exports.updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params; // role_id
    const { permissions } = req.body;
    // permissions: [{module, can_view, can_create, can_edit, can_delete}]

    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Delete existing and re-create (idempotent)
    await prisma.permission.deleteMany({ where: { role_id: roleId } });

    const created = await Promise.all(
      permissions.map(perm =>
        prisma.permission.create({
          data: {
            role_id: roleId,
            module: perm.module,
            can_view: perm.can_view || false,
            can_create: perm.can_create || false,
            can_edit: perm.can_edit || false,
            can_delete: perm.can_delete || false
          }
        })
      )
    );

    // Socket.io: barcha aktiv sessiyalarga yangilash
    req.io.to('admin-updates').emit('permissions-updated', { roleId, roleName: role.name });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'PERMISSIONS_UPDATED',
        entity_type: 'Role',
        entity_id: roleId,
        metadata: toJson({ roleName: role.name, permissionCount: created.length })
      }
    });

    res.json({ message: 'Permissions updated', permissions: created });
  } catch (error) {
    console.error('ADM Permissions Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.3 Update Role Details (name/description) — Admin role's name is protected,
// since 'Admin' is checked by exact string elsewhere (rbacMiddleware, socket rooms)
exports.updateRoleDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const data = { description };
    if (name !== undefined && name !== role.name) {
      if (role.name === 'Admin') {
        return res.status(400).json({ error: "The Admin role's name cannot be changed — it is relied on internally for full-access checks." });
      }
      const nameTaken = await prisma.role.findUnique({ where: { name } });
      if (nameTaken) return res.status(400).json({ error: 'A role with that name already exists' });
      data.name = name;
    }

    const updated = await prisma.role.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error('ADM UpdateRoleDetails Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.4 Get Payment Gateways — Click/Payme/Uzum rows are created on first save (upsert), so this may return
// fewer than the known gateway names until each has been configured at least once.
exports.getPaymentGateways = async (req, res) => {
  try {
    const gateways = await prisma.paymentGatewayConfig.findMany();
    const safe = gateways.map(gw => ({
      ...gw,
      api_key_encrypted: gw.api_key_encrypted ? '****' : null,
      api_secret_encrypted: gw.api_secret_encrypted ? '****' : null
    }));
    res.json(safe);
  } catch (error) {
    console.error('ADM Gateways Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.4 Update (or create, first time) a Payment Gateway config, identified by name (Click/Payme/Uzum/...)
exports.updatePaymentGateway = async (req, res) => {
  try {
    const { name } = req.params;
    const { merchant_id, api_key, api_secret, is_active } = req.body;

    const existing = await prisma.paymentGatewayConfig.findUnique({ where: { name } });
    const data = { merchant_id, is_active: !!is_active };
    // Only re-encrypt secrets that were actually submitted — the frontend sends '****' when left unchanged.
    if (api_key && api_key !== '****') data.api_key_encrypted = cryptoHelper.encrypt(api_key);
    if (api_secret && api_secret !== '****') data.api_secret_encrypted = cryptoHelper.encrypt(api_secret);

    const gateway = await prisma.paymentGatewayConfig.upsert({
      where: { name },
      update: data,
      create: { name, ...data }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: existing ? 'PAYMENT_GATEWAY_UPDATED' : 'PAYMENT_GATEWAY_CREATED',
        entity_type: 'PaymentGatewayConfig',
        entity_id: gateway.id,
        metadata: toJson({ gateway_name: name })
      }
    });

    res.json({ message: 'Gateway updated' });
  } catch (error) {
    console.error('ADM UpdateGW Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.5 Get Hotel Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.hotelSettings.findFirst();
    if (!settings) return res.json({});
    res.json({
      ...settings,
      social_links: fromJson(settings.social_links),
      enabled_languages: fromJson(settings.enabled_languages)
    });
  } catch (error) {
    console.error('ADM GetSettings Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.5 Update Hotel Settings
exports.updateSettings = async (req, res) => {
  console.log("UPDATE SETTINGS REQ.BODY:", req.body);
  try {
    const { 
      name, address, logo_url, social_links, theme_color, 
      enabled_languages, description, contact_phone, contact_email,
      internal_name, internal_logo_url, internal_theme_color, app_language
    } = req.body;
    const dataToSave = {
      name, address, logo_url, theme_color, description, contact_phone, contact_email,
      internal_name, internal_logo_url, internal_theme_color, app_language,
      social_links: social_links ? toJson(social_links) : null,
      enabled_languages: enabled_languages ? toJson(enabled_languages) : null
    };

    // Upsert: singleton pattern
    const existing = await prisma.hotelSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.hotelSettings.update({
        where: { id: existing.id },
        data: dataToSave
      });
    } else {
      settings = await prisma.hotelSettings.create({
        data: dataToSave
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('ADM Settings Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.5 Upload Hotel Logo (file, replacing the manual logo_url text field)
exports.uploadHotelLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const logo_url = `/uploads/branding/${req.file.filename}`;

    const existing = await prisma.hotelSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.hotelSettings.update({ where: { id: existing.id }, data: { logo_url } });
    } else {
      settings = await prisma.hotelSettings.create({ data: { name: 'Hotel', address: '', logo_url } });
    }

    res.json(settings);
  } catch (error) {
    console.error('ADM UploadHotelLogo Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadInternalLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const internal_logo_url = `/uploads/branding/${req.file.filename}`;

    const existing = await prisma.hotelSettings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.hotelSettings.update({ where: { id: existing.id }, data: { internal_logo_url } });
    } else {
      settings = await prisma.hotelSettings.create({ data: { name: 'Hotel', address: '', internal_logo_url } });
    }

    res.json(settings);
  } catch (error) {
    console.error('ADM UploadInternalLogo Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.6 Get Audit Logs (FAQAT GET — append-only)
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity_type } = req.query;
    const where = {};
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { full_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('ADM AuditLogs Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.7 Financial Dashboard
exports.getFinancialDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRevenue, monthRevenue, totalRevenue, pendingPayments, vendorExpenses] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Completed', created_at: { gte: today } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Completed', created_at: { gte: thisMonth } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Completed' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'Pending' } }),
      prisma.vendorPayment.aggregate({ _sum: { amount: true } })
    ]);

    res.json({
      todayRevenue: todayRevenue._sum.amount || 0,
      monthRevenue: monthRevenue._sum.amount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      totalVendorExpenses: vendorExpenses._sum.amount || 0,
      netProfit: (totalRevenue._sum.amount || 0) - (vendorExpenses._sum.amount || 0)
    });
  } catch (error) {
    console.error('ADM Financial Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const DB_FILE = path.join(__dirname, '..', '..', 'prisma', 'dev.db');

// 6.8 List Backups
exports.getBackups = async (req, res) => {
  try {
    const backups = await prisma.backupRecord.findMany({ orderBy: { created_at: 'desc' } });
    res.json(backups);
  } catch (error) {
    console.error('ADM GetBackups Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.8 Create Backup — for this SQLite dev setup, a real backup is just a timestamped copy of the DB file.
exports.createBackup = async (req, res) => {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const filename = `hotel-erp-${Date.now()}.db`;
    const destPath = path.join(BACKUP_DIR, filename);
    fs.copyFileSync(DB_FILE, destPath);
    const { size } = fs.statSync(destPath);

    const backup = await prisma.backupRecord.create({
      data: { file_url: `/backups/${filename}`, size, type: 'Manual' }
    });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'BACKUP_CREATED', entity_type: 'BackupRecord', entity_id: backup.id }
    });

    res.status(201).json(backup);
  } catch (error) {
    console.error('ADM Backup Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.8 Restore Backup — overwrites the live SQLite file. The running server should be restarted
// afterwards so Prisma's connection isn't left pointing at stale file-handle state.
exports.restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const backup = await prisma.backupRecord.findUnique({ where: { id: parseInt(id) } });
    if (!backup) return res.status(404).json({ error: 'Backup not found' });

    const filename = path.basename(backup.file_url);
    const sourcePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Backup file no longer exists on disk' });

    fs.copyFileSync(sourcePath, DB_FILE);

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'BACKUP_RESTORE_COMPLETED', entity_type: 'BackupRecord', entity_id: parseInt(id) }
    });

    res.json({ message: 'Backup restored. Restart the server for the change to take full effect.', backup });
  } catch (error) {
    console.error('ADM Restore Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Get Integrations
exports.getIntegrations = async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany();
    // Mask sensitive config data
    const safe = integrations.map(i => {
      const parsed = i.config ? fromJson(i.config) : {};
      const masked = { ...parsed };
      ['api_key_encrypted', 'api_secret_encrypted', 'webhook_shared_secret_encrypted'].forEach(key => {
        if (masked[key]) masked[key] = '****';
      });
      return { ...i, config: masked };
    });
    res.json(safe);
  } catch (error) {
    console.error('ADM Integrations Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Sync Booking.com
exports.syncBookingCom = async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
    if (!integration || integration.status !== 'Active') {
      return res.status(400).json({ error: 'Booking.com integration is not active' });
    }

    // In production, actual API call to Booking.com
    await prisma.integration.update({
      where: { type: 'BookingCom' },
      data: { last_sync_at: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action: 'BOOKING_COM_SYNC',
        entity_type: 'Integration',
        entity_id: integration.id
      }
    });

    res.json({ message: 'Sync initiated', last_sync_at: new Date() });
  } catch (error) {
    console.error('ADM Sync Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Room Mapping Matrix — map our RoomType to Booking.com's own room_id (needed for real ARI/reservation sync)
exports.updateRoomTypeBookingComMapping = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { booking_com_room_id } = req.body;
    const roomType = await prisma.roomType.update({
      where: { id },
      data: { booking_com_room_id: booking_com_room_id || null }
    });
    res.json(roomType);
  } catch (error) {
    console.error('ADM UpdateRoomTypeMapping Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Push ARI (Availability, Rates, Inventory) — stub until real Booking.com API credentials exist.
// Records the attempt (audit log + timestamp) so the UI can show "Last ARI Push" honestly.
exports.pushAri = async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
    if (!integration) return res.status(400).json({ error: 'Booking.com integration is not configured yet' });

    const config = fromJson(integration.config) || {};
    config.last_ari_push_at = new Date().toISOString();
    await prisma.integration.update({ where: { type: 'BookingCom' }, data: { config: toJson(config) } });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'BOOKING_COM_ARI_PUSH', entity_type: 'Integration', entity_id: integration.id }
    });

    res.json({
      message: 'ARI push recorded. This is a stub until real Booking.com Connectivity API credentials are connected — it does not yet send anything to Booking.com.',
      last_ari_push_at: config.last_ari_push_at
    });
  } catch (error) {
    console.error('ADM PushAri Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Update Booking.com Integration settings (credentials encrypted at rest)
exports.updateBookingComIntegration = async (req, res) => {
  try {
    const { hotel_id, api_key, api_secret, webhook_shared_secret, default_payment_model, commission_rate, status } = req.body;

    const existing = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
    const existingConfig = existing ? (fromJson(existing.config) || {}) : {};

    const config = {
      ...existingConfig,
      hotel_id: hotel_id !== undefined ? hotel_id : existingConfig.hotel_id,
      default_payment_model: default_payment_model !== undefined ? default_payment_model : existingConfig.default_payment_model,
      commission_rate: commission_rate !== undefined ? parseFloat(commission_rate) : existingConfig.commission_rate
    };
    // Only re-encrypt secrets that were actually submitted — keep prior ones otherwise (frontend sends masked '****' when unchanged)
    if (api_key && api_key !== '****') config.api_key_encrypted = cryptoHelper.encrypt(api_key);
    if (api_secret && api_secret !== '****') config.api_secret_encrypted = cryptoHelper.encrypt(api_secret);
    if (webhook_shared_secret && webhook_shared_secret !== '****') config.webhook_shared_secret_encrypted = cryptoHelper.encrypt(webhook_shared_secret);

    const integration = await prisma.integration.upsert({
      where: { type: 'BookingCom' },
      update: { config: toJson(config), status: status || existing?.status || 'Inactive' },
      create: { type: 'BookingCom', config: toJson(config), status: status || 'Inactive' }
    });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'BOOKING_COM_INTEGRATION_UPDATED', entity_type: 'Integration', entity_id: integration.id }
    });

    res.json({ message: 'Booking.com integration updated', status: integration.status });
  } catch (error) {
    console.error('ADM UpdateBookingComIntegration Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Test Booking.com Connection — shape/field-presence check only (no real Booking.com credentials to call against)
exports.testBookingComConnection = async (req, res) => {
  try {
    const integration = await prisma.integration.findUnique({ where: { type: 'BookingCom' } });
    if (!integration) return res.json({ ok: false, checks: {}, message: 'Booking.com integration is not configured yet' });

    const config = fromJson(integration.config) || {};
    const checks = { hotel_id: !!config.hotel_id, api_credentials: false, webhook_secret: false };

    try {
      checks.api_credentials = !!(config.api_key_encrypted && cryptoHelper.decrypt(config.api_key_encrypted) && config.api_secret_encrypted && cryptoHelper.decrypt(config.api_secret_encrypted));
    } catch { checks.api_credentials = false; }
    try {
      checks.webhook_secret = !!(config.webhook_shared_secret_encrypted && cryptoHelper.decrypt(config.webhook_shared_secret_encrypted));
    } catch { checks.webhook_secret = false; }

    const ok = checks.hotel_id && checks.api_credentials && checks.webhook_secret;
    res.json({ ok, checks, message: ok ? 'All required fields are present and decryptable' : 'Some required fields are missing — this only verifies configuration shape, not a live connection to Booking.com' });
  } catch (error) {
    console.error('ADM TestBookingComConnection Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Webhook Logs (paginated)
exports.getWebhookLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const where = status ? { processing_status: status } : {};

    const [logs, total] = await Promise.all([
      prisma.bookingComWebhookLog.findMany({
        where,
        orderBy: { received_at: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.bookingComWebhookLog.count({ where })
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('ADM WebhookLogs Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Retry a failed webhook log — replays the stored payload through the same handler functions
exports.retryWebhookLog = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const log = await prisma.bookingComWebhookLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: 'Webhook log not found' });

    const payload = fromJson(log.payload);
    const result = await bookingComWebhookController.processWebhookPayload(payload, req.io);

    const updated = await prisma.bookingComWebhookLog.update({
      where: { id },
      data: {
        processing_status: result.success ? 'success' : 'failed',
        error_message: result.success ? null : result.message,
        processed_at: new Date()
      }
    });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'BOOKING_COM_WEBHOOK_RETRIED', entity_type: 'BookingComWebhookLog', entity_id: id, metadata: toJson({ success: result.success }) }
    });

    res.json({ log: updated, result });
  } catch (error) {
    console.error('ADM RetryWebhookLog Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Commission Reconciliation — upload a Booking.com monthly statement (CSV) and diff against stored reservations
// Assumed CSV columns (real Booking.com export format unknown, confirm/adjust once a real sample exists):
// external_reservation_id, check_in_date, check_out_date, room_type, gross_amount, commission_amount, currency, statement_date
exports.uploadCommissionStatement = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'A CSV file (field name "statement") is required' });

    let rows;
    try {
      rows = parseCsv(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true, bom: true });
    } catch (parseError) {
      return res.status(400).json({ error: `Could not parse CSV: ${parseError.message}` });
    }

    const matched = [];
    const mismatched = [];
    const notFound = [];

    for (const row of rows) {
      const externalId = row.external_reservation_id;
      if (!externalId) continue;

      const reservation = await prisma.bookingComReservation.findUnique({ where: { external_reservation_id: externalId } });
      if (!reservation) {
        notFound.push({ external_reservation_id: externalId, statement_row: row });
        continue;
      }

      const statementCommission = parseFloat(row.commission_amount);
      const storedCommission = reservation.commission_amount;
      const tolerance = 0.01;
      const commissionMatches = storedCommission != null && !isNaN(statementCommission) && Math.abs(storedCommission - statementCommission) <= tolerance;

      if (commissionMatches) {
        matched.push({ external_reservation_id: externalId, commission_amount: storedCommission });
      } else {
        mismatched.push({
          external_reservation_id: externalId,
          stored_commission_amount: storedCommission,
          statement_commission_amount: isNaN(statementCommission) ? null : statementCommission
        });
      }
    }

    res.json({ matched, mismatched, notFound, totalRows: rows.length });
  } catch (error) {
    console.error('ADM CommissionReconciliation Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6.9 Update Key Card System
exports.updateKeyCardSystem = async (req, res) => {
  try {
    const { config, status } = req.body;

    const existing = await prisma.integration.findUnique({ where: { type: 'KeyCardSystem' } });
    let integration;
    if (existing) {
      integration = await prisma.integration.update({
        where: { type: 'KeyCardSystem' },
        data: { config: toJson(config), status }
      });
    } else {
      integration = await prisma.integration.create({
        data: { type: 'KeyCardSystem', config: toJson(config), status }
      });
    }

    res.json(integration);
  } catch (error) {
    console.error('ADM KeyCard Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Room Types — list (includes photo_url, capacity, description used across the app)
exports.getRoomTypes = async (req, res) => {
  try {
    const roomTypes = await prisma.roomType.findMany({ orderBy: { base_price: 'asc' } });
    res.json(roomTypes);
  } catch (error) {
    console.error('ADM GetRoomTypes Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Room Types — create a new type
exports.createRoomType = async (req, res) => {
  try {
    const { name, base_price, capacity, description } = req.body;
    if (!name || base_price === undefined || capacity === undefined) {
      return res.status(400).json({ error: 'name, base_price and capacity are required' });
    }

    const existing = await prisma.roomType.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: `A room type named "${name}" already exists` });

    const roomType = await prisma.roomType.create({
      data: { name, base_price: parseFloat(base_price), capacity: parseInt(capacity), description: description || null }
    });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'ROOM_TYPE_CREATED', entity_type: 'RoomType', entity_id: roomType.id, metadata: toJson({ name }) }
    });

    res.status(201).json(roomType);
  } catch (error) {
    console.error('ADM CreateRoomType Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Room Types — delete (only if no rooms use it)
exports.deleteRoomType = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const roomCount = await prisma.room.count({ where: { room_type_id: id } });
    if (roomCount > 0) {
      return res.status(400).json({ error: `${roomCount} room(s) still use this type. Reassign or delete them first.` });
    }

    const roomType = await prisma.roomType.findUnique({ where: { id } });
    if (!roomType) return res.status(404).json({ error: 'Room type not found' });

    await prisma.roomType.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'ROOM_TYPE_DELETED', entity_type: 'RoomType', entity_id: id, metadata: toJson({ name: roomType.name }) }
    });

    res.json({ message: 'Room type deleted successfully' });
  } catch (error) {
    console.error('ADM DeleteRoomType Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Room Types — update details (name, price, capacity, description)
exports.updateRoomType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, base_price, capacity, description } = req.body;

    const roomType = await prisma.roomType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        base_price: base_price !== undefined ? parseFloat(base_price) : undefined,
        capacity: capacity !== undefined ? parseInt(capacity) : undefined,
        description
      }
    });
    res.json(roomType);
  } catch (error) {
    console.error('ADM UpdateRoomType Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Room Types — upload/replace photo
exports.uploadRoomTypePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    const photo_url = `/uploads/room-types/${req.file.filename}`;
    const roomType = await prisma.roomType.update({
      where: { id: parseInt(id) },
      data: { photo_url }
    });
    res.json(roomType);
  } catch (error) {
    console.error('ADM UploadRoomTypePhoto Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Individual Rooms — full CRUD (room number, floor, type, status, notes)
exports.getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { room_type: true },
      orderBy: { room_number: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('ADM GetRooms Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { room_number, floor, room_type_id, notes } = req.body;
    if (!room_number || floor === undefined || floor === null || !room_type_id) {
      return res.status(400).json({ error: 'room_number, floor and room_type_id are required' });
    }

    const roomType = await prisma.roomType.findUnique({ where: { id: parseInt(room_type_id) } });
    if (!roomType) return res.status(400).json({ error: 'Invalid room_type_id' });

    const existing = await prisma.room.findUnique({ where: { room_number: String(room_number) } });
    if (existing) return res.status(400).json({ error: `Room ${room_number} already exists` });

    const room = await prisma.room.create({
      data: {
        room_number: String(room_number),
        floor: parseInt(floor),
        room_type_id: parseInt(room_type_id),
        notes: notes || null
      },
      include: { room_type: true }
    });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'ROOM_CREATED', entity_type: 'Room', entity_id: room.id, metadata: toJson({ room_number: room.room_number }) }
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('ADM CreateRoom Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { room_number, floor, room_type_id, reception_status, notes } = req.body;

    const data = {};
    if (room_number !== undefined) data.room_number = String(room_number);
    if (floor !== undefined) data.floor = parseInt(floor);
    if (room_type_id !== undefined) data.room_type_id = parseInt(room_type_id);
    if (reception_status !== undefined) data.reception_status = reception_status;
    if (notes !== undefined) data.notes = notes;

    const room = await prisma.room.update({ where: { id }, data, include: { room_type: true } });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'ROOM_UPDATED', entity_type: 'Room', entity_id: id, metadata: toJson(req.body) }
    });

    res.json(room);
  } catch (error) {
    console.error('ADM UpdateRoom Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadRoomPhoto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

    const photo_url = `/uploads/rooms/${req.file.filename}`;
    const room = await prisma.room.update({ where: { id }, data: { photo_url }, include: { room_type: true } });
    res.json(room);
  } catch (error) {
    console.error('ADM UploadRoomPhoto Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const bookingCount = await prisma.booking.count({ where: { room_id: id } });
    if (bookingCount > 0) {
      return res.status(400).json({ error: 'This room has booking history and cannot be deleted. Mark it as Maintenance instead if it needs to be taken offline.' });
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    await prisma.room.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { user_id: req.user.userId, action: 'ROOM_DELETED', entity_type: 'Room', entity_id: id, metadata: toJson({ room_number: room.room_number }) }
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('ADM DeleteRoom Error:', error);
    res.status(500).json({ error: 'Server error — this room may still have related records (housekeeping tasks, lost items, etc).' });
  }
};
