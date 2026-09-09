const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pointsEarned: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'points']
  },
  cardLast4: {
    type: String,
    maxlength: 4,
    default: null
  },
  shippingCity: { type: String, trim: true },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);