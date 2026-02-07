const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
  },
  dob: {
    type: Date,
    default: null,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  dlNumber: {
    type: String,
    trim: true,
    default: '',
  },
  dlExpiry: {
    type: Date,
    default: null,
  },
  dlPhoto: {
    type: String, // URL or base64 string
    default: '',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);

