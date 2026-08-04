const express = require('express');
const router = express.Router();
const webhookCtrl = require('../controllers/bookingComWebhookController');

// Public — no staff/guest auth, signature verified inside via HMAC shared secret
router.post('/booking-com', webhookCtrl.receiveWebhook);

module.exports = router;
