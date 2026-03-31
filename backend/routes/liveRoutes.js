const express = require('express');
const { getLiveFeed, createCFOrder } = require('../controllers/liveController');
const router = express.Router();

router.get('/', getLiveFeed);
router.post('/cf-order', createCFOrder);

module.exports = router;
