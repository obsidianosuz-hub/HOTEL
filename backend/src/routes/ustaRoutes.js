const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const ustaController = require('../controllers/ustaController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), ustaController.getDashboard);
router.get('/requests', checkPermission('maintenance', 'view'), ustaController.getMyRequests);
router.patch('/requests/:id/status', checkPermission('maintenance', 'edit'), ustaController.updateRequestStatus);

router.get('/supplies/items', checkPermission('maintenance', 'view'), ustaController.getSupplyItems);
router.post('/supplies/request', checkPermission('maintenance', 'edit'), ustaController.requestSupplies);

module.exports = router;
