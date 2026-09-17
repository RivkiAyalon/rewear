const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.post('/', auth, ctrl.createOrder);
router.get('/my', auth, ctrl.getMyOrders);
router.get('/sales', auth, ctrl.getMySales);

module.exports = router;