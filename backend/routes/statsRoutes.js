const express = require('express');
const { getDashboardStats, getAnalyticsStats, testNotification } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/analytics', protect, getAnalyticsStats);
router.get('/test-notification', protect, testNotification);

module.exports = router;
