const Favorite = require('../models/Favorite');

exports.addFavorite = async (req, res) => {
  try {
    console.log('ADD FAVORITE:', req.user.id, req.body.productId);
    const fav = await Favorite.create({
      userId: req.user.id,
      productId: req.body.productId
    });

    res.status(201).json(fav);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Already in favorites'
      });
    }

    res.status(400).json({
      message: err.message
    });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const favs = await Favorite.find({
      userId: req.user.id
    }).populate('productId');

    res.json(
      favs
        .map(f => f.productId)
        .filter(Boolean)
    );

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};