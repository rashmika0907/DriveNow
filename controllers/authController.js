const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateEmail, validatePassword } = require('../utils/validation');
const { JWT_SECRET } = require('../middleware/auth');
const cacheService = require('../services/cacheService');
const { addWelcomeEmailJob } = require('../queues/emailQueue');

/**
 * Sign up a new user
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Queue welcome email (async, non-blocking)
    addWelcomeEmailJob({
      id: user._id,
      email: user.email,
      name: user.name,
    }).catch(err => {
      console.error('Failed to queue welcome email:', err.message);
    });

    // Set token in cookie for server-side access
    // In production, consider httpOnly: true for better security
    res.cookie('token', token, {
      httpOnly: process.env.COOKIE_HTTP_ONLY === 'true', // Default false for client-side access
      secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax', // 'strict', 'lax', or 'none'
      maxAge: parseInt(process.env.JWT_EXPIRY_HOURS || '24', 10) * 60 * 60 * 1000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined, // Set for cross-subdomain cookies
    });

    // Ensure isAdmin is explicitly boolean
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1;

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        phone: user.phone,
        isAdmin: isAdmin, // Explicitly set isAdmin
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email received:', email);
    console.log('Password received:', password ? '[PROVIDED]' : '[NOT PROVIDED]');
    console.log('Email lowercase:', email?.toLowerCase());

    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('User found in DB:', user ? '✅ YES' : '❌ NO');
    
    if (!user) {
      console.log('❌ User not found with email:', email.toLowerCase().trim());
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User ID:', user._id);
    console.log('Comparing password...');
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch for user:', user.email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', user.email);
    console.log('Token generated');

    // Set token in cookie for server-side access
    // In production, consider httpOnly: true for better security
    res.cookie('token', token, {
      httpOnly: process.env.COOKIE_HTTP_ONLY === 'true', // Default false for client-side access
      secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax', // 'strict', 'lax', or 'none'
      maxAge: parseInt(process.env.JWT_EXPIRY_HOURS || '24', 10) * 60 * 60 * 1000,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined, // Set for cross-subdomain cookies
    });

    // Ensure isAdmin is explicitly boolean
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        phone: user.phone,
        isAdmin: isAdmin, // Explicitly set isAdmin
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    next(error);
  }
};

/**
 * Get current user
 * Cached with 1 minute TTL (short TTL for user data)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cacheKey = cacheService.generateResourceKey('user:profile', userId);
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached && cached.user && cached.user.isAdmin !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // If cached data doesn't have isAdmin, invalidate and fetch fresh
    if (cached) {
      try {
        await cacheService.invalidate(cacheKey);
      } catch (cacheError) {
        // Ignore cache errors
      }
    }

    // Cache miss - fetch from database
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure isAdmin is explicitly included
    const isAdmin = user.isAdmin === true || user.isAdmin === 'true' || user.isAdmin === 1;
    
    const userData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        phone: user.phone,
        dlNumber: user.dlNumber,
        dlExpiry: user.dlExpiry,
        hasDL: !!(user.dlNumber || user.dlPhoto),
        isAdmin: isAdmin, // Explicitly set isAdmin
      },
    };
    
    // Log for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('📋 getCurrentUser - User data:', {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        isAdminType: typeof user.isAdmin,
        isAdminValue: isAdmin,
      });
    }
    
    // Cache the result (1 minute TTL for user data)
    await cacheService.set(cacheKey, userData, 60);
    res.set('X-Cache', 'MISS');
    
    res.json(userData);
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getCurrentUser };

