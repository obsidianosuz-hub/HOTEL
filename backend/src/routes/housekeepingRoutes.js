const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const housekeepingController = require('../controllers/housekeepingController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), housekeepingController.getDashboard);
router.get('/tasks', checkPermission('tasks', 'view'), housekeepingController.getTasks);
router.post('/tasks/:id/start', checkPermission('tasks', 'edit'), housekeepingController.startTask);
router.post('/tasks/:id/complete', checkPermission('tasks', 'edit'), housekeepingController.completeTask);
router.post('/tasks/:id/mark-issues', checkPermission('tasks', 'edit'), housekeepingController.markIssues);
router.get('/rooms', checkPermission('rooms', 'view'), housekeepingController.getRooms);
router.put('/rooms/:id/status', checkPermission('rooms', 'edit'), housekeepingController.updateRoomStatus);
router.get('/rooms/by-floor/:floor', checkPermission('rooms', 'view'), housekeepingController.getRoomsByFloor);
const lfUpload = require('../middlewares/lostFoundUploadMiddleware');

router.get('/lost-items', checkPermission('lost-items', 'view'), housekeepingController.getLostItems);
router.post('/lost-items', checkPermission('lost-items', 'create'), lfUpload.single('photo'), housekeepingController.reportLostItem);
router.get('/supplies/items', checkPermission('Housekeeping', 'view'), housekeepingController.getSupplyItems);
router.post('/supplies/request', checkPermission('Housekeeping', 'create'), housekeepingController.requestSupplies);
router.get('/reports', checkPermission('Housekeeping', 'view'), housekeepingController.getReports);
router.get('/staff', checkPermission('Housekeeping', 'view'), housekeepingController.getStaff);
router.post('/tasks/:id/reassign', checkPermission('tasks', 'edit'), housekeepingController.reassignTask);
const maintenanceUpload = require('../middlewares/maintenanceUploadMiddleware');
router.post('/maintenance-report', checkPermission('rooms', 'create'), maintenanceUpload.single('photo'), housekeepingController.reportMaintenanceIssue);

module.exports = router;
