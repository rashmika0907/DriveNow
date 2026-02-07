const Rental = require('../models/Rental');
const { readCars } = require('../utils/carUtils');
const cacheService = require('../services/cacheService');

// Environment variables with defaults
const ADMIN_CACHE_TTL = parseInt(process.env.ADMIN_CACHE_TTL || '60', 10); // 60 seconds default

/**
 * Get admin dashboard with statistics
 */
const getDashboard = async (req, res, next) => {
  try {
    const cacheKey = cacheService.generateResourceKey('admin:dashboard', 'stats');
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.render('admin/dashboard', { stats: cached });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Total bookings
    const bookingsToday = await Rental.countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const bookingsThisWeek = await Rental.countDocuments({
      createdAt: { $gte: weekStart }
    });
    
    const bookingsThisMonth = await Rental.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // Get all cars
    const allCars = readCars();
    const totalCars = allCars.length;

    // Active rentals (not cancelled, end date in future)
    const activeRentals = await Rental.find({
      status: { $ne: 'cancelled' },
      endDate: { $gte: todayStart }
    }).lean();

    // Get unique car IDs from active rentals
    const activeCarIds = new Set(activeRentals.map(r => r.carId));
    const activeCarsCount = activeCarIds.size;

    // Cars under maintenance (from car data - we'll add this field)
    const maintenanceCars = allCars.filter(car => car.maintenanceMode === true).length;
    const availableCars = totalCars - activeCarsCount - maintenanceCars;

    // Today's pickups and returns
    const todaysPickups = await Rental.countDocuments({
      startDate: { $gte: todayStart, $lt: todayEnd },
      status: { $ne: 'cancelled' }
    });

    const todaysReturns = await Rental.countDocuments({
      endDate: { $gte: todayStart, $lt: todayEnd },
      status: { $ne: 'cancelled' }
    });

    // Revenue calculations
    const revenueToday = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenueTodayAmount = revenueToday[0]?.total || 0;

    const revenueThisMonth = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenueMonthAmount = revenueThisMonth[0]?.total || 0;

    const revenueYTD = await Rental.aggregate([
      {
        $match: {
          createdAt: { $gte: yearStart },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenueYTDAmount = revenueYTD[0]?.total || 0;

    const stats = {
      bookings: {
        today: bookingsToday,
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
      },
      cars: {
        total: totalCars,
        active: activeCarsCount,
        available: availableCars,
        maintenance: maintenanceCars,
      },
      operations: {
        pickupsToday: todaysPickups,
        returnsToday: todaysReturns,
      },
      revenue: {
        today: revenueTodayAmount,
        thisMonth: revenueMonthAmount,
        ytd: revenueYTDAmount,
      },
    };

    // Cache with configurable TTL
    try {
      await cacheService.set(cacheKey, stats, ADMIN_CACHE_TTL);
    } catch (cacheError) {
      // Log but don't fail if cache fails
      console.error('Failed to cache dashboard stats:', cacheError.message);
    }
    res.set('X-Cache', 'MISS');

    res.render('admin/dashboard', { stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};

module.exports = { getDashboard };

