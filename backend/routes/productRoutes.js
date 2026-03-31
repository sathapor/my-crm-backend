const express = require('express');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/',       protect, getProducts);
router.post('/',      protect, createProduct);
router.put('/:id',    protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
