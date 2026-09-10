const { auth } = require('../middleware/auth');

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', auth, ctrl.getMe);
router.put('/me', auth, ctrl.updateMe);
router.get('/points', auth, ctrl.getPoints);

module.exports = router;

