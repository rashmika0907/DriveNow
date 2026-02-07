const mongoose = require('mongoose');

/**
 * Global error handler middleware
 * Must have exactly 4 parameters (err, req, res, next) for Express to recognize it as error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('========== ERROR HANDLER ==========');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  console.error('===================================');

  // Ensure response hasn't been sent
  if (res.headersSent) {
    return next(err);
  }

  // MongoDB connection errors (only if an error actually occurred)
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    return res.status(503).json({
      message: 'Database connection error. Please ensure MongoDB is running and try again.'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  // Cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid data format provided' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // For API routes, return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      message: err.message || 'Server error'
    });
  }

  // For view routes, render error page or redirect
  res.status(err.status || 500).render('home', { error: err.message || 'Server error' });
};

module.exports = errorHandler;

