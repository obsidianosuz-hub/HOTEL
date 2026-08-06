const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const oshpazController = require('../controllers/oshpazController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), oshpazController.getDashboard);
router.get('/orders', checkPermission('kitchen-orders', 'view'), oshpazController.getOrders);
router.patch('/orders/:id/status', checkPermission('kitchen-orders', 'edit'), oshpazController.updateOrderStatus);

router.get('/supplies/items', checkPermission('kitchen-orders', 'view'), oshpazController.getSupplyItems);
router.post('/supplies/request', checkPermission('kitchen-orders', 'edit'), oshpazController.requestSupplies);

module.exports = router;
