const express = require('express');
const { getOrders, createOrder, updateOrder, deleteOrder, exportCSV } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/',           protect, getOrders);
router.get('/export/csv', protect, exportCSV);
router.post('/',          protect, createOrder);
router.put('/:id',        protect, updateOrder);
router.delete('/:id',     protect, deleteOrder);

module.exports = router;
