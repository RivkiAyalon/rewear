const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// כל מה שמתחת מוגן — שורה אחת שמגנה על כל הקובץ
router.use(auth, isAdmin);

router.get('/users', ctrl.getUsers);
router.put('/users/:id/role', ctrl.changeRole);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/orders', ctrl.getOrders);

// מחזירה את הנתונים הסטטיסטיים שיוצגו בכרטיסי ה-Admin Dashboard
router.get('/stats', ctrl.getStats);
router.get('/sales-by-month', ctrl.getSalesByMonth);
router.get('/top-sellers', ctrl.getTopSellers);

router.get('/products', ctrl.getProducts);
router.delete('/products/:id', ctrl.deleteProduct);

module.exports = router;