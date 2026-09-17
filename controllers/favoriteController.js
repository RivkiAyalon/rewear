const Favorite = require('../models/Favorite');

exports.addFavorite = async (req, res) => {
   try {
    if (!req.body?.productId) {
      return res.status(400).json({ message: 'Product is required' });
    }
  
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

// הסרה ממועדפים
exports.removeFavorite = async (req, res) => {
  try {
    const fav = await Favorite.findOneAndDelete({
      userId: req.user.id,
      productId: req.params.productId
    });

    if (!fav) {
      return res.status(404).json({ message: 'Not in favorites' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};