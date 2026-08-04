const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Fully public — no auth. Backs the public hotel landing page.
router.get('/settings', publicController.getSettings);
router.get('/hotel-info', publicController.getHotelInfo);

module.exports = router;
