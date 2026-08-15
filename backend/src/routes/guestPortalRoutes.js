const express = require('express');
const router = express.Router();
const guestPortalController = require('../controllers/guestPortalController');
const guestAuthMiddleware = require('../middlewares/guestAuthMiddleware');

// All guest portal routes require a valid guest token
router.use(guestAuthMiddleware);

router.get('/my-bill', guestPortalController.getMyBill);
router.get('/requests', guestPortalController.getMyRequests);
router.post('/requests', guestPortalController.submitRequest);
router.post('/orders', guestPortalController.submitOrder);
router.get('/menu', guestPortalController.getMenu);

module.exports = router;
