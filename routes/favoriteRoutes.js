const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/favoriteController');

router.post('/', auth, ctrl.addFavorite);
router.get('/', auth, ctrl.getFavorites);

router.delete('/:productId', auth, ctrl.removeFavorite);

module.exports = router;