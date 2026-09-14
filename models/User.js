const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  points: {
    type: Number,
    default: 0,
    min: 0
  },

  city: {
    type: String,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  avatar: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);