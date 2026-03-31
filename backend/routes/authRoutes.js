const express = require('express');
const { login, register, getMe, refreshToken } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login); // Note: Server.js mounts rate limiting solely for this
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);

// Admin only route example
router.get('/admin', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, data: "Admin restricted data access" });
});

module.exports = router;
