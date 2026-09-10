const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

// כל מה שמתחת מוגן — שורה אחת שמגנה על כל הקובץ
router.use(auth, isAdmin);

router.get('/users', ctrl.getUsers);
router.put('/users/:id/role', ctrl.changeRole);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;