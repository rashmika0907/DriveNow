const { readCars, filterCars, paginate } = require('../utils/carUtils');
const Rental = require('../models/Rental');
const cacheService = require('../services/cacheService');

/**
 * Get all cars with filtering and pagination
 * Cached with 5 minute TTL
 */
const getCars = async (req, res, next) => {
  try {
    // Generate cache key
    const cacheKey = cacheService.generateCacheKey(req);

    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache miss - fetch from source
    let cars = readCars();

    // Determine availability from rentals (active/upcoming & not cancelled)
    let unavailableIds = new Set();
    try {
      if (require('mongoose').connection.readyState === 1) {
        const now = new Date();
        const activeRentals = await Rental.find({
          endDate: { $gte: now },
          status: { $ne: 'cancelled' },
        }).select('carId');
        unavailableIds = new Set(activeRentals.map(r => Number(r.carId)));
      }
    } catch (dbError) {
      console.warn('⚠️ MongoDB unreachable, skipping availability check');
    }

    // Sorting
    const sort = req.query.sort;
    if (sort === 'priceAsc') {
      cars = [...cars].sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sort === 'priceDesc') {
      cars = [...cars].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }
    const filtered = filterCars(cars, req.query).map((car) => ({
      ...car,
      isAvailable: !unavailableIds.has(Number(car.id)),
    }));
    const result = paginate(filtered, req.query.page, req.query.pageSize);

    // Cache the result (5 minutes TTL)
    await cacheService.set(cacheKey, result, 300);
    res.set('X-Cache', 'MISS');

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single car by ID
 * Cached with 10 minute TTL
 */
const getCarById = async (req, res, next) => {
  try {
    const carId = req.params.id;
    const cacheKey = cacheService.generateResourceKey('cars:detail', carId);

    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Cache miss - fetch from source
    const cars = readCars();
    const car = cars.find((item) => String(item.id) === String(carId));

    // Mark availability for this car
    let isAvailable = true;
    try {
      if (require('mongoose').connection.readyState === 1) {
        const now = new Date();
        const activeRental = await Rental.findOne({
          carId: Number(carId),
          endDate: { $gte: now },
          status: { $ne: 'cancelled' },
        }).select('_id');
        isAvailable = !activeRental;
      }
    } catch (dbError) {
      console.warn('⚠️ MongoDB unreachable, assuming car is available');
    }
    const carWithAvailability = { ...car, isAvailable };

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Cache the result (10 minutes TTL)
    await cacheService.set(cacheKey, carWithAvailability, 600);
    res.set('X-Cache', 'MISS');

    res.json(carWithAvailability);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCars, getCarById };

