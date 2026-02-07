const mongoose = require('mongoose');

/**
 * Creates middleware to check MongoDB connection status
 * Returns 503 if database is not connected
 * @param {string} mongodbUri - MongoDB connection URI
 */
const createDBConnectionCheck = (mongodbUri) => {
  return async (req, res, next) => {
    if (!next || typeof next !== 'function') {
      console.error('ERROR: next is not a function in dbCheck middleware');
      console.error('next type:', typeof next);
      console.error('next value:', next);
      return res.status(500).json({ message: 'Internal server error: middleware chain broken' });
    }
    
    try {
      if (mongoose.connection.readyState === 0) {
        // Not connected, try to connect
        try {
          await mongoose.connect(mongodbUri, {
            serverSelectionTimeoutMS: 5000,
          });
        } catch (err) {
          console.error('DB connection check failed:', err.message);
          return res.status(503).json({ 
            message: 'Database not connected. Please ensure MongoDB is running.' 
          });
        }
      } else if (mongoose.connection.readyState !== 1) {
        console.error('DB connection state:', mongoose.connection.readyState);
        return res.status(503).json({ 
          message: 'Database connection is not ready. Please try again in a moment.' 
        });
      }
      next();
    } catch (error) {
      console.error('DB check middleware error:', error);
      next(error);
    }
  };
};

module.exports = { createDBConnectionCheck };

