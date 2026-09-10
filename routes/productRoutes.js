const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/productController');

// GET all products
router.get('/', ctrl.getProducts);

// GET my products
router.get('/my', auth, ctrl.getMyProducts);

// GET single product by ID
router.get('/:id', ctrl.getProduct);
// POST create product
router.post('/', auth, ctrl.createProduct);
module.exports = router;