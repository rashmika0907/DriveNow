const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const carController = require('../controllers/carController');
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');
const { createDBConnectionCheck } = require('../middleware/dbCheck');
const { MONGODB_URI } = require('../config/database');

const checkDBConnection = createDBConnectionCheck(MONGODB_URI);

// Car routes (public)
router.get('/cars', carController.getCars);
router.get('/cars/:id', carController.getCarById);

// Auth routes
router.post('/signup', checkDBConnection, authController.signup);
router.post('/login', checkDBConnection, authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);

// Profile routes (protected)
router.put('/profile', authenticateToken, checkDBConnection, profileController.updateProfile);

// Booking routes (protected)
router.post('/bookings', authenticateToken, checkDBConnection, bookingController.createBooking);
router.get('/my-rentals', authenticateToken, checkDBConnection, bookingController.getMyRentals);
router.post('/my-rentals/:id/cancel', authenticateToken, checkDBConnection, bookingController.cancelRental);
// Alias for cancellation under bookings path
router.post('/bookings/:id/cancel', authenticateToken, checkDBConnection, bookingController.cancelRental);

module.exports = router;

