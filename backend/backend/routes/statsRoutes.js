const express = require('express');
const { getDashboardStats, getAnalyticsStats } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/analytics', protect, getAnalyticsStats);

module.exports = router;
