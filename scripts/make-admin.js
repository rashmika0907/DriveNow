/**
 * Script to make a user an admin
 * Usage: node scripts/make-admin.js <email>
 * Example: node scripts/make-admin.js admin@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { MONGODB_URI } = require('../config/database');

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.log('Usage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js admin@example.com');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`);
      process.exit(1);
    }

    // Update user to admin
    user.isAdmin = true;
    await user.save();

    console.log(`✅ Successfully made "${user.name}" (${user.email}) an admin`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

makeAdmin();

