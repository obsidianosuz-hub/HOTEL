const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const bellboyController = require('../controllers/bellboyController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), bellboyController.getDashboard);
router.get('/tasks', checkPermission('tasks', 'view'), bellboyController.getTasks);
router.post('/tasks/:id/start', checkPermission('tasks', 'edit'), bellboyController.startTask);
router.post('/tasks/:id/complete', checkPermission('tasks', 'edit'), bellboyController.completeTask);
router.get('/guest-requests', checkPermission('guest-requests', 'view'), bellboyController.getGuestRequests);
router.post('/guest-requests/:id/accept', checkPermission('guest-requests', 'edit'), bellboyController.acceptGuestRequest);
router.post('/guest-requests/:id/complete', checkPermission('guest-requests', 'edit'), bellboyController.completeGuestRequest);
router.get('/luggage', checkPermission('luggage', 'view'), bellboyController.getLuggage);
router.post('/luggage/store', checkPermission('luggage', 'create'), bellboyController.storeLuggage);
router.post('/luggage/:id/deliver', checkPermission('luggage', 'edit'), bellboyController.deliverLuggage);

module.exports = router;
