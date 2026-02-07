const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/requireAdmin');
const { upload, handleUploadError } = require('../middleware/upload');
const adminController = require('../controllers/adminController');
const adminCarController = require('../controllers/adminCarController');
const adminBookingController = require('../controllers/adminBookingController');

// All admin routes require authentication and admin role
router.use(requireAdminAuth);

// Dashboard
router.get('/', adminController.getDashboard);
router.get('/dashboard', adminController.getDashboard);

// Car Management Routes
router.get('/cars', (req, res) => res.render('admin/cars'));
router.get('/cars/new', (req, res) => res.render('admin/car-form', { car: null, editing: false }));
router.get('/cars/calendar', (req, res) => res.render('admin/car-calendar'));
router.get('/cars/:id/edit', async (req, res, next) => {
  try {
    const { readCars } = require('../utils/carUtils');
    const cars = readCars();
    const car = cars.find(c => String(c.id) === String(req.params.id));
    if (!car) {
      return res.status(404).render('admin/cars', { error: 'Car not found' });
    }
    res.render('admin/car-form', { car, editing: true });
  } catch (error) {
    next(error);
  }
});

// Car API Routes
router.get('/api/cars', adminCarController.getCars);
router.get('/api/cars/:id', adminCarController.getCarById);
router.post('/api/cars', upload.single('image'), handleUploadError, adminCarController.createCar);
router.put('/api/cars/:id', upload.single('image'), handleUploadError, adminCarController.updateCar);
router.delete('/api/cars/:id', adminCarController.deleteCar);
router.patch('/api/cars/:id/maintenance', adminCarController.toggleMaintenance);

// Booking Management Routes
router.get('/bookings', (req, res) => res.render('admin/bookings'));
router.get('/api/bookings', adminBookingController.getBookings);
router.get('/api/bookings/:id', adminBookingController.getBookingById);
router.post('/api/bookings/:id/cancel', adminBookingController.cancelBooking);

module.exports = router;

