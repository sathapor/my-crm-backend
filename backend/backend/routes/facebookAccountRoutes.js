const express = require('express');
const { getFacebookAccounts, addFacebookAccount, deleteFacebookAccount } = require('../controllers/facebookAccountController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getFacebookAccounts);
router.post('/', protect, addFacebookAccount);
router.delete('/:id', protect, deleteFacebookAccount);

module.exports = router;
