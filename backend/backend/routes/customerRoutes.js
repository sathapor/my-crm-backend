const express = require('express');
const { getCustomers, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/',       protect, getCustomers);
router.post('/',      protect, createCustomer);
router.put('/:id',    protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
