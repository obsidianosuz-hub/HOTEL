const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const guestAuth = require('../middlewares/guestAuthMiddleware');

// Public route
router.get('/rooms/available', guestController.getAvailableRooms);

// Protected Guest routes
router.use(guestAuth);

router.post('/bookings/draft', guestController.createDraftBooking);
router.get('/bookings', guestController.getMyBookings);
router.patch('/bookings/:booking_code/cancel', guestController.cancelBooking);
router.get('/receipts/:id', guestController.getReceipt);
router.put('/settings', guestController.updateSettings);
router.post('/support-requests', guestController.createSupportRequest);

module.exports = router;
