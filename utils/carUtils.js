const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'cars.json');

/**
 * Read cars data from JSON file
 */
const readCars = () => {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading cars data:', error);
    return []; // Return empty array on error
  }
};

/**
 * Write cars data to JSON file with atomic write (write to temp file then rename)
 * This prevents corruption if the process crashes during write
 */
const writeCars = (cars) => {
  try {
    // Validate cars array
    if (!Array.isArray(cars)) {
      throw new Error('Cars data must be an array');
    }

    // Create temporary file path
    const tempPath = DATA_PATH + '.tmp';
    const jsonData = JSON.stringify(cars, null, 2);
    
    // Write to temporary file first
    fs.writeFileSync(tempPath, jsonData, 'utf-8');
    
    // Atomic rename (this is atomic on most filesystems)
    fs.renameSync(tempPath, DATA_PATH);
    
    return true;
  } catch (error) {
    // Clean up temp file if it exists
    try {
      const tempPath = DATA_PATH + '.tmp';
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    console.error('Error writing cars data:', error);
    throw error;
  }
};

/**
 * Filter cars based on query parameters
 */
const filterCars = (cars, query) => {
  return cars.filter((car) => {
    const q = query.q ? query.q.toLowerCase() : '';
    if (q && !(car.make.toLowerCase().includes(q) || car.model.toLowerCase().includes(q))) return false;
    if (query.make && car.make.toLowerCase() !== query.make.toLowerCase()) return false;
    if (query.model && !car.model.toLowerCase().includes(query.model.toLowerCase())) return false;
    if (query.year && Number(car.year) !== Number(query.year)) return false;
    if (query.seats && Number(car.seats) !== Number(query.seats)) return false;
    if (query.transmission && car.transmission.toLowerCase() !== query.transmission.toLowerCase()) return false;
    if (query.fuel && car.fuel.toLowerCase() !== query.fuel.toLowerCase()) return false;

    const price = Number(car.pricePerDay);
    if (query.minPrice && price < Number(query.minPrice)) return false;
    if (query.maxPrice && price > Number(query.maxPrice)) return false;

    return true;
  });
};

/**
 * Paginate items array
 */
const paginate = (items, page = 1, pageSize = 10) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 10));
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const start = (safePage - 1) * safePageSize;
  const data = items.slice(start, start + safePageSize);

  return {
    data,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalPages,
      totalCount,
    },
  };
};

module.exports = { readCars, writeCars, filterCars, paginate };

