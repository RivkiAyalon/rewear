const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/favoriteController');

router.post('/', auth, ctrl.addFavorite);
router.get('/', auth, ctrl.getFavorites);

module.exports = router;