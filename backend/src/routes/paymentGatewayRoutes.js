const express = require('express');
const router = express.Router();
const gwCtrl = require('../controllers/paymentGatewayController');
const staffAuth = require('../middlewares/staffAuthMiddleware');
const guestAuth = require('../middlewares/guestAuthMiddleware');

// Click
router.post('/click/create-url', (req, res, next) => {
  // Bu endpoint ikkala auth'da ham ishlaydi (staff va guest)
  // Agar staff token bo'lsa — staff auth, aks holda guest auth
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  // Try staff first, then guest
  staffAuth(req, res, (err) => {
    if (!err && req.user) return next();
    guestAuth(req, res, (err2) => {
      if (!err2 && req.guest) return next();
      return res.status(401).json({ error: 'Unauthorized' });
    });
  });
}, gwCtrl.clickCreateUrl);

// Click Webhook (Public — no auth, but signature verified inside)
router.post('/click/webhook', gwCtrl.clickWebhook);

// Payme
router.post('/payme/create-url', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  staffAuth(req, res, (err) => {
    if (!err && req.user) return next();
    guestAuth(req, res, (err2) => {
      if (!err2 && req.guest) return next();
      return res.status(401).json({ error: 'Unauthorized' });
    });
  });
}, gwCtrl.paymeCreateUrl);

// Payme Webhook (Public — Basic Auth verified inside via Payme protocol)
router.post('/payme/webhook', gwCtrl.paymeWebhook);

module.exports = router;
