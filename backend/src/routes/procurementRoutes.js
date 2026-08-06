const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const procurementController = require('../controllers/procurementController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), procurementController.getDashboard);
router.post('/vendors', checkPermission('vendors', 'create'), procurementController.createVendor);
router.put('/vendors/:id', checkPermission('vendors', 'edit'), procurementController.updateVendor);
router.post('/purchase-orders', checkPermission('purchase-orders', 'create'), procurementController.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', checkPermission('purchase-orders', 'edit'), procurementController.receivePurchaseOrder);
router.get('/inventory', checkPermission('inventory', 'view'), procurementController.getInventory);
router.post('/inventory', checkPermission('inventory', 'create'), procurementController.createInventoryItem);
router.post('/inventory/:id/reorder', checkPermission('inventory', 'edit'), procurementController.reorderInventoryItem);
router.post('/inventory/reorder', checkPermission('inventory', 'create'), procurementController.reorderInventory);
router.post('/invoices/:id/approve', checkPermission('invoices', 'edit'), procurementController.approveInvoice);
router.post('/invoices/:id/reject', checkPermission('invoices', 'edit'), procurementController.rejectInvoice);
router.post('/payments', checkPermission('payments', 'create'), procurementController.processPayment);
router.get('/reports', checkPermission('reports', 'view'), procurementController.getReports);

router.get('/supply-requests', checkPermission('dashboard', 'view'), procurementController.getSupplyRequests);
router.put('/supply-requests/:id/fulfill', checkPermission('dashboard', 'edit'), procurementController.fulfillSupplyRequest);

module.exports = router;
