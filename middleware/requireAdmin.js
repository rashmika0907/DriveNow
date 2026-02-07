const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

/**
 * Extract token from various sources (for view routes)
 */
const extractToken = (req) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    token = req.cookies?.token || req.query.token;
  }
  
  return token;
};

/**
 * Middleware to require admin access
 * Handles both API and view routes
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);
    
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Admin check:', {
        path: req.path,
        hasToken: !!token,
        tokenSource: req.headers['authorization'] ? 'header' : (req.cookies?.token ? 'cookie' : (req.query.token ? 'query' : 'none')),
      });
    }
    
    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ No token found for admin route');
      }
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      return res.redirect('/login?error=admin-access-required');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      return res.redirect('/login?error=invalid-token');
    }

    req.user = decoded;

    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.userId).select('isAdmin');
    
    if (!user) {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.redirect('/login?error=user-not-found');
    }

    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('👤 User admin status:', {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    }

    if (!user.isAdmin) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('❌ User is not admin');
      }
      // For API routes, return JSON error
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      // For view routes, redirect to home with error
      return res.redirect('/?error=admin-access-required');
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Admin access granted');
    }
    next();
  } catch (error) {
    // Always log errors
    console.error('Admin check error:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ message: 'Server error checking admin status' });
    }
    return res.redirect('/login?error=server-error');
  }
};

/**
 * Combined middleware: authenticate + require admin
 * Use this for admin routes that need both auth and admin check
 */
const requireAdminAuth = [requireAdmin];

module.exports = { requireAdmin, requireAdminAuth };

