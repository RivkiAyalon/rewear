const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/messageController');
const { auth, isAdmin } = require('../middleware/auth');

// מאפשר לכל משתמש, גם לאורחת, לשלוח הודעה.
router.post('/', ctrl.createMessage);

// מאפשרת רק למנהלת לצפות בהודעות.
router.get('/', auth, isAdmin, ctrl.getMessages);

// מאפשרת רק למנהלת לסמן הודעה כנקראה.
router.put('/:id/read', auth, isAdmin, ctrl.markRead);

module.exports = router;