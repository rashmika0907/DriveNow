const Rental = require('../models/Rental');
const User = require('../models/User');
const { readCars } = require('../utils/carUtils');
const { validatePagination } = require('../utils/adminValidation');

// Environment variables with defaults
const ADMIN_PAGE_SIZE = parseInt(process.env.ADMIN_PAGE_SIZE || '20', 10);
const ADMIN_MAX_PAGE_SIZE = parseInt(process.env.ADMIN_MAX_PAGE_SIZE || '100', 10);

/**
 * Get all bookings with filters
 */
const getBookings = async (req, res, next) => {
  try {
    const { status, startDate, endDate, carId, page, pageSize } = req.query;
    
    // Validate and sanitize pagination
    const pagination = validatePagination(page || 1, pageSize || ADMIN_PAGE_SIZE, ADMIN_MAX_PAGE_SIZE);
    
    let query = {};
    
    // Validate status
    const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
      query.status = status;
    }
    
    // Validate and parse dates
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ message: 'Invalid start date format' });
        }
        query.startDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ message: 'Invalid end date format' });
        }
        query.startDate.$lte = end;
      }
    }
    
    // Validate carId
    if (carId) {
      if (isNaN(parseInt(carId))) {
        return res.status(400).json({ message: 'Invalid car ID' });
      }
      query.carId = parseInt(carId);
    }

    const skip = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    const bookings = await Rental.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Rental.countDocuments(query);

    // Populate car details and user details
    const cars = readCars();
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const car = cars.find(c => String(c.id) === String(booking.carId));
        const user = await User.findById(booking.userId).select('name email phone').lean();
        
        return {
          ...booking,
          carDetails: car || null,
          userDetails: user || null,
        };
      })
    );

    res.json({
      bookings: bookingsWithDetails,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    next(error);
  }
};

/**
 * Get single booking by ID
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Rental.findById(id).lean();
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const cars = readCars();
    const car = cars.find(c => String(c.id) === String(booking.carId));
    const user = await User.findById(booking.userId).select('name email phone dlNumber').lean();

    res.json({
      booking: {
        ...booking,
        carDetails: car || null,
        userDetails: user || null,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    next(error);
  }
};

/**
 * Cancel booking (admin override)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Rental.findById(id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Invalidate cache
    try {
      const cacheService = require('../services/cacheService');
      await cacheService.invalidate(cacheService.generateResourceKey('user:rentals', booking.userId));
      await cacheService.invalidate(cacheService.generateResourceKey('cars:availability', booking.carId));
      await cacheService.invalidatePattern('/api/cars:*');
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError.message);
      // Continue anyway - cache will expire naturally
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    next(error);
  }
};

module.exports = {
  getBookings,
  getBookingById,
  cancelBooking,
};

