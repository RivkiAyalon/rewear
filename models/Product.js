const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: { type: String, trim: true },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  brand: {
    type: String,
    trim: true,
    default: 'No brand'
  },
  gender: {
    type: String,
    required: [true, 'Gender category is required'],
    enum: ['women', 'men', 'kids']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['clothing', 'shoes', 'accessories']
  },
  type: {
    type: String,
    required: [true, 'Item type is required']
  },
  size: {
    type: String,
    required: [true, 'Size is required']
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new-tags', 'new', 'excellent', 'very-good', 'good']
  },
  color: { type: String, trim: true },
  images: {
    type: [String],
    validate: {
      validator: arr => arr.length > 0,
      message: 'At least one image is required'
    }
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city: { type: String, trim: true },
  status: {
    type: String,
    enum: ['available', 'sold'],
    default: 'available'
  },
  views: { type: Number, default: 0 }
}, { timestamps: true });

// אינדקסים — מזרזים את הסינון בחנות
productSchema.index({ gender: 1, category: 1, type: 1 });
productSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);