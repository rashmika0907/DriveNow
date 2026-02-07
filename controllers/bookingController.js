const mongoose = require('mongoose');
const Rental = require('../models/Rental');
const User = require('../models/User');
const { readCars } = require('../utils/carUtils');
const { validateDateRange, validateDLNumber, validateDLExpiry } = require('../utils/validation');
const cacheService = require('../services/cacheService');
const pubsubService = require('../services/pubsubService');
const { addBookingConfirmationJob, addBookingReminderJob } = require('../queues/emailQueue');

/**
 * Create a new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const { carId, startDate, endDate } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      console.error('No userId in request.user');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validation
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Car ID, start date, and end date are required' });
    }

    // Check if user has valid driving license
    const user = await User.findById(userId).select('dlNumber dlExpiry dlPhoto');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate DL is present and valid
    if (!user.dlNumber && !user.dlPhoto) {
      return res.status(400).json({ 
        message: 'Driving license verification required. Please add your driving license details.',
        requiresDL: true 
      });
    }

    // If DL number is provided, validate it
    if (user.dlNumber) {
      const dlValidation = validateDLNumber(user.dlNumber);
      if (!dlValidation.valid) {
        return res.status(400).json({ message: dlValidation.message, requiresDL: true });
      }

      // Validate expiry date
      if (user.dlExpiry) {
        const expiryValidation = validateDLExpiry(user.dlExpiry);
        if (!expiryValidation.valid) {
          return res.status(400).json({ message: expiryValidation.message, requiresDL: true });
        }
      } else {
        return res.status(400).json({ 
          message: 'Driving license expiry date is required',
          requiresDL: true 
        });
      }
    }

    // Validate dates
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      return res.status(400).json({ message: dateValidation.message });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get car details
    const cars = readCars();
    const car = cars.find((c) => Number(c.id) === Number(carId));

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Calculate total days and price
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * car.pricePerDay;

    // Ensure userId is a valid ObjectId
    let userIdObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userIdObjectId = new mongoose.Types.ObjectId(userId);
      } else {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid user ID format: ' + err.message });
    }

    // Create rental
    const rental = new Rental({
      userId: userIdObjectId,
      carId: Number(carId),
      carDetails: {
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        image: car.image || '',
        pricePerDay: car.pricePerDay || 0,
        seats: car.seats || 5,
        transmission: car.transmission || 'Automatic',
        fuel: car.fuel || 'Petrol',
      },
      startDate: start,
      endDate: end,
      totalDays,
      totalPrice,
      status: 'active',
    });

    await rental.save();

    // Invalidate user rentals cache
    await cacheService.invalidate(cacheService.generateResourceKey('user:rentals', userId));

    // Publish booking created event
    pubsubService.publish('booking:created', {
      rentalId: rental._id.toString(),
      userId: userId,
      carId: rental.carId,
      totalPrice: rental.totalPrice,
      startDate: rental.startDate,
      endDate: rental.endDate,
    });

    // Queue booking confirmation email (async, non-blocking)
    addBookingConfirmationJob({
      userId: userId,
      rentalId: rental._id.toString(),
      carDetails: rental.carDetails,
      bookingDetails: {
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalPrice: rental.totalPrice,
        totalDays: rental.totalDays,
      },
    }).catch(err => {
      console.error('Failed to queue booking confirmation email:', err.message);
    });

    // Queue booking reminder (24 hours before start)
    const reminderTime = new Date(rental.startDate);
    reminderTime.setHours(reminderTime.getHours() - 24);
    if (reminderTime > new Date()) {
      addBookingReminderJob({
        userId: userId,
        rentalId: rental._id.toString(),
        carDetails: rental.carDetails,
        startDate: rental.startDate,
      }, reminderTime).catch(err => {
        console.error('Failed to queue booking reminder:', err.message);
      });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      rental: {
        id: rental._id,
        carId: rental.carId,
        carDetails: rental.carDetails,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalDays: rental.totalDays,
        totalPrice: rental.totalPrice,
        status: rental.status,
        createdAt: rental.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's rentals
 * Cached with 2 minute TTL, invalidated on booking creation
 */
const getMyRentals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cacheKey = cacheService.generateResourceKey('user:rentals', userId);
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache miss - fetch from database
    const rentals = await Rental.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const rentalsData = {
      rentals: rentals.map(rental => ({
        id: rental._id,
        carId: rental.carId,
        carDetails: rental.carDetails,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalDays: rental.totalDays,
        totalPrice: rental.totalPrice,
        status: rental.status,
        createdAt: rental.createdAt,
      })),
    };

    // Cache the result (2 minutes TTL)
    await cacheService.set(cacheKey, rentalsData, 120);
    res.set('X-Cache', 'MISS');
    
    res.json(rentalsData);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a rental (if upcoming/active)
 */
const cancelRental = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const rentalId = req.params.id;

    const rental = await Rental.findOne({ _id: rentalId, userId });
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (rental.status === 'completed' || rental.status === 'cancelled') {
      return res.status(400).json({ message: 'Rental cannot be cancelled' });
    }

    rental.status = 'cancelled';
    await rental.save();

    // Invalidate cache
    await cacheService.invalidate(cacheService.generateResourceKey('user:rentals', userId));

    // Publish status change
    pubsubService.publish('booking:status:changed', {
      rentalId: rental._id.toString(),
      userId,
      status: rental.status,
    });

    res.json({
      message: 'Rental cancelled',
      rental: {
        id: rental._id,
        status: rental.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my rentals page
 */
const getMyRentalsPage = async (req, res, next) => {
  try {
    const rentals = await Rental.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Get user data for rendering
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.redirect('/login');
    }
    
    res.render('my-rentals', { user, rentals: rentals || [] });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyRentals, getMyRentalsPage, cancelRental };

