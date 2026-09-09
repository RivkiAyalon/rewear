const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, { timestamps: true });

// אותה משתמשת לא יכולה לסמן את אותו מוצר פעמיים
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);