const express = require('express');
const router = express.Router();
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const managerController = require('../controllers/managerController');

router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), managerController.getDashboard);
router.get('/analytics/revenue', checkPermission('analytics', 'view'), managerController.getRevenueAnalytics);
router.get('/analytics/channel-performance', checkPermission('analytics', 'view'), managerController.getChannelPerformance);
router.get('/analytics/occupancy', checkPermission('analytics', 'view'), managerController.getOccupancyAnalytics);
router.get('/staff', checkPermission('staff', 'view'), managerController.getStaff);
router.post('/staff', checkPermission('staff', 'edit'), managerController.addStaff);
router.get('/staff-performance', checkPermission('staff', 'view'), managerController.getStaffPerformanceList);
router.get('/staff/:id/performance', checkPermission('staff', 'view'), managerController.getStaffPerformance);
router.get('/analytics/room-performance', checkPermission('analytics', 'view'), managerController.getRoomPerformanceAnalytics);
router.get('/bookings', checkPermission('bookings', 'view'), managerController.getBookings);
router.patch('/bookings/:booking_code/cancel', checkPermission('bookings', 'edit'), managerController.cancelBooking);
router.get('/lost-items', checkPermission('lost-items', 'view'), managerController.getLostItems);
router.post('/lost-items/:id/return', checkPermission('lost-items', 'edit'), managerController.returnLostItem);
router.get('/rooms', checkPermission('maintenance', 'view'), managerController.getRooms);
router.put('/rooms/:id/status', checkPermission('maintenance', 'edit'), managerController.updateRoomStatus);
router.get('/maintenance-requests', checkPermission('maintenance', 'view'), managerController.getMaintenanceRequests);
router.post('/maintenance-requests', checkPermission('maintenance', 'create'), managerController.createMaintenanceRequest);
router.post('/maintenance-requests/:id/assign', checkPermission('maintenance', 'edit'), managerController.assignMaintenanceRequest);
router.post('/maintenance-requests/:id/resolve', checkPermission('maintenance', 'edit'), managerController.resolveMaintenanceRequest);
router.get('/reports/daily', checkPermission('analytics', 'view'), managerController.getDailyReports);
router.get('/reports/monthly', checkPermission('analytics', 'view'), managerController.getMonthlyReports);
router.get('/settings/rates', checkPermission('rates', 'view'), managerController.getSeasonalRates);
router.put('/settings/rates', checkPermission('rates', 'edit'), managerController.updateRates);
router.delete('/settings/rates/:id', checkPermission('rates', 'edit'), managerController.deleteSeasonalRate);
router.get('/usta-users', checkPermission('maintenance', 'view'), managerController.getUstaUsers);

module.exports = router;
