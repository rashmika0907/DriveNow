const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drivenow';

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    console.error('  Make sure MongoDB is running or update MONGODB_URI');
    console.error('  Local: mongod (or brew services start mongodb-community)');
    console.error('  Cloud: Get connection string from MongoDB Atlas');
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = { connectDB, MONGODB_URI };

