const express = require('express');
const { getLineAccounts, addLineAccount, deleteLineAccount } = require('../controllers/lineAccountController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getLineAccounts);
router.post('/', protect, addLineAccount);
router.delete('/:id', protect, deleteLineAccount);

module.exports = router;
