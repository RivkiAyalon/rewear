const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/productController');

router.get('/', ctrl.getProducts);

module.exports = router;