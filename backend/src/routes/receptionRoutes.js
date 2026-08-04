const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const staffAuth = require('../middlewares/staffAuthMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');

// Himoya: Faqat Reception/Manager/Admin kira oladi (staff token)
router.use(staffAuth);

router.get('/dashboard', checkPermission('dashboard', 'view'), receptionController.getDashboard);
router.post('/check-in', checkPermission('bookings', 'edit'), receptionController.checkIn);
router.post('/check-out', checkPermission('bookings', 'edit'), receptionController.checkOut);
router.get('/rooms', checkPermission('rooms', 'view'), receptionController.getRooms);
router.post('/bookings', checkPermission('bookings', 'create'), receptionController.createBooking);
router.get('/guests/search', checkPermission('bookings', 'view'), receptionController.searchGuestByPhone);
router.get('/guests', checkPermission('bookings', 'view'), receptionController.searchGuests);
router.post('/guests', checkPermission('bookings', 'create'), receptionController.createGuest);
router.post('/payments', checkPermission('payments', 'create'), receptionController.collectPayment);
router.get('/bookings/search', checkPermission('bookings', 'view'), receptionController.searchBookings);
router.post('/bookings/cancel', checkPermission('bookings', 'edit'), receptionController.cancelBooking);
router.get('/cash-register/current', checkPermission('payments', 'view'), receptionController.getCurrentCashSession);
router.post('/cash-register/open', checkPermission('payments', 'create'), receptionController.openCashSession);
router.post('/cash-register/close', checkPermission('payments', 'edit'), receptionController.closeCashSession);
router.get('/bookings/:booking_code/receipts', checkPermission('payments', 'view'), receptionController.getReceipts);
router.get('/bookings/:booking_code/payments', checkPermission('payments', 'view'), receptionController.getBookingPayments);
router.post('/payments/refund', checkPermission('payments', 'edit'), receptionController.refundPayment);
router.get('/guests/:guest_id/ledger', checkPermission('bookings', 'view'), receptionController.getGuestLedger);
router.get('/reports/daily', checkPermission('dashboard', 'view'), receptionController.getDailyReport);

module.exports = router;
