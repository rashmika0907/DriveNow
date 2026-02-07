const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const bookingController = require('../controllers/bookingController');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Helper middleware to extract token from various sources for view routes
 */
const extractToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    token = req.cookies?.token || req.query.token;
  }
  
  if (!token) {
    console.log('No token found for profile route, redirecting to login');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed for profile route:', error.message);
    return res.redirect('/login');
  }
};

// Public routes
router.get('/', (_req, res) => {
  res.render('home');
});

router.get('/browse', (_req, res) => {
  res.render('browse');
});

router.get('/about', (_req, res) => {
  res.render('about');
});

router.get('/login', (_req, res) => {
  res.render('login');
});

// Logout route - clear cookies and redirect to home
router.get('/logout', (req, res) => {
  // Clear all cookies
  res.clearCookie('token', { path: '/' });
  res.clearCookie('user', { path: '/' });
  
  // Redirect to home page with logout parameter
  res.redirect('/?logout=true');
});

// Protected routes
router.get('/my-rentals', extractToken, bookingController.getMyRentalsPage);
router.get('/profile', extractToken, profileController.getProfilePage);

module.exports = router;

