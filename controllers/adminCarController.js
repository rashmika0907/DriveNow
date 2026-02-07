const fs = require('fs');
const path = require('path');
const { readCars, writeCars } = require('../utils/carUtils');
const { validateCarData, sanitizeCarData, validateFileUpload } = require('../utils/adminValidation');
const { UPLOAD_DIR } = require('../middleware/upload');

/**
 * Get all cars for admin management
 */
const getCars = async (req, res, next) => {
  try {
    const cars = readCars();
    res.json({ cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    next(error);
  }
};

/**
 * Get single car by ID
 */
const getCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cars = readCars();
    const car = cars.find(c => String(c.id) === String(id));
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.json({ car });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new car
 */
const createCar = async (req, res, next) => {
  try {
    // Validate file upload if present
    if (req.file) {
      const fileValidation = validateFileUpload(req.file);
      if (!fileValidation.valid) {
        // Delete uploaded file if validation fails
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete invalid file:', deleteError);
        }
        return res.status(400).json({ message: fileValidation.errors.join(', ') });
      }
    }

    // Validate and sanitize car data
    const validation = validateCarData(req.body, false);
    if (!validation.valid) {
      // Delete uploaded file if validation fails
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete file after validation error:', deleteError);
        }
      }
      return res.status(400).json({ message: validation.errors.join(', ') });
    }

    const sanitized = sanitizeCarData(req.body);
    const cars = readCars();
    
    // Generate new ID (handle potential race condition)
    let newId = 1;
    if (cars.length > 0) {
      const maxId = Math.max(...cars.map(c => c.id || 0));
      newId = maxId + 1;
    }
    
    // Get image path from multer upload or validate existing URL
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/cars/${req.file.filename}`;
    } else if (req.body.image) {
      // Validate that it's a valid URL or path
      const imageUrl = String(req.body.image).trim();
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
        imagePath = imageUrl;
      } else {
        return res.status(400).json({ message: 'Invalid image URL format' });
      }
    }
    
    const newCar = {
      id: newId,
      make: sanitized.make,
      model: sanitized.model,
      year: parseInt(sanitized.year),
      pricePerDay: parseFloat(sanitized.pricePerDay),
      image: imagePath,
      seats: parseInt(sanitized.seats),
      transmission: sanitized.transmission,
      fuel: sanitized.fuel,
      mileage: sanitized.mileage || '',
      fuelPolicy: sanitized.fuelPolicy || 'Standard policy applies',
      tags: sanitized.tags || [],
      maintenanceMode: sanitized.maintenanceMode === 'true' || sanitized.maintenanceMode === true || false,
      maintenanceUntil: sanitized.maintenanceUntil || null,
    };

    cars.push(newCar);
    
    // Write with error handling
    try {
      writeCars(cars);
    } catch (writeError) {
      // Delete uploaded file if write fails
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete file after write error:', deleteError);
        }
      }
      throw writeError;
    }

    // Invalidate cache
    try {
      const cacheService = require('../services/cacheService');
      await cacheService.invalidatePattern('/api/cars:*');
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError.message);
    }

    res.status(201).json({ message: 'Car created successfully', car: newCar });
  } catch (error) {
    console.error('Error creating car:', error);
    next(error);
  }
};

/**
 * Update existing car
 */
const updateCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    // Validate file upload if present
    if (req.file) {
      const fileValidation = validateFileUpload(req.file);
      if (!fileValidation.valid) {
        // Delete uploaded file if validation fails
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete invalid file:', deleteError);
        }
        return res.status(400).json({ message: fileValidation.errors.join(', ') });
      }
    }

    const cars = readCars();
    const carIndex = cars.findIndex(c => String(c.id) === String(id));
    
    if (carIndex === -1) {
      // Delete uploaded file if car not found
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete file:', deleteError);
        }
      }
      return res.status(404).json({ message: 'Car not found' });
    }

    const existingCar = cars[carIndex];
    
    // Merge existing data with updates
    const updateData = { ...req.body };
    
    // Validate updated data
    const validation = validateCarData(updateData, true);
    if (!validation.valid) {
      // Delete uploaded file if validation fails
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete file after validation error:', deleteError);
        }
      }
      return res.status(400).json({ message: validation.errors.join(', ') });
    }

    const sanitized = sanitizeCarData(updateData);
    
    // Update image if new file uploaded, otherwise keep existing or use provided URL
    let imagePath = existingCar.image;
    if (req.file) {
      imagePath = `/uploads/cars/${req.file.filename}`;
      // Delete old image if it exists and is local
      if (existingCar.image && existingCar.image.startsWith('/uploads/cars/')) {
        try {
          const oldImagePath = path.join(__dirname, '..', 'public', existingCar.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete old image:', deleteError);
          // Continue anyway - old image will be orphaned
        }
      }
    } else if (sanitized.image !== undefined) {
      // Validate image URL if provided
      const imageUrl = String(sanitized.image).trim();
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/'))) {
        imagePath = imageUrl;
      } else if (imageUrl) {
        return res.status(400).json({ message: 'Invalid image URL format' });
      }
    }
    
    // Build updated car object
    const updatedCar = {
      ...existingCar,
      make: sanitized.make !== undefined ? sanitized.make : existingCar.make,
      model: sanitized.model !== undefined ? sanitized.model : existingCar.model,
      year: sanitized.year !== undefined ? parseInt(sanitized.year) : existingCar.year,
      pricePerDay: sanitized.pricePerDay !== undefined ? parseFloat(sanitized.pricePerDay) : existingCar.pricePerDay,
      image: imagePath,
      seats: sanitized.seats !== undefined ? parseInt(sanitized.seats) : existingCar.seats,
      transmission: sanitized.transmission !== undefined ? sanitized.transmission : existingCar.transmission,
      fuel: sanitized.fuel !== undefined ? sanitized.fuel : existingCar.fuel,
      mileage: sanitized.mileage !== undefined ? sanitized.mileage : existingCar.mileage,
      fuelPolicy: sanitized.fuelPolicy !== undefined ? sanitized.fuelPolicy : existingCar.fuelPolicy,
      tags: sanitized.tags !== undefined ? sanitized.tags : (existingCar.tags || []),
      maintenanceMode: sanitized.maintenanceMode !== undefined ? (sanitized.maintenanceMode === 'true' || sanitized.maintenanceMode === true) : existingCar.maintenanceMode,
      maintenanceUntil: sanitized.maintenanceUntil !== undefined ? sanitized.maintenanceUntil : existingCar.maintenanceUntil,
    };

    cars[carIndex] = updatedCar;

    // Write with error handling
    try {
      writeCars(cars);
    } catch (writeError) {
      // Delete uploaded file if write fails
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (deleteError) {
          console.error('Failed to delete file after write error:', deleteError);
        }
      }
      throw writeError;
    }

    // Invalidate cache
    try {
      const cacheService = require('../services/cacheService');
      await cacheService.invalidatePattern('/api/cars:*');
      await cacheService.invalidate(cacheService.generateResourceKey('cars:availability', id));
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError.message);
    }

    res.json({ message: 'Car updated successfully', car: updatedCar });
  } catch (error) {
    console.error('Error updating car:', error);
    next(error);
  }
};

/**
 * Delete car
 */
const deleteCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    const cars = readCars();
    const carIndex = cars.findIndex(c => String(c.id) === String(id));
    
    if (carIndex === -1) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Delete associated image if exists
    const car = cars[carIndex];
    if (car.image && car.image.startsWith('/uploads/cars/')) {
      try {
        const imagePath = path.join(__dirname, '..', 'public', car.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (deleteError) {
        console.error('Failed to delete car image:', deleteError);
        // Continue with car deletion even if image deletion fails
      }
    }

    cars.splice(carIndex, 1);
    
    // Write with error handling
    try {
      writeCars(cars);
    } catch (writeError) {
      console.error('Failed to write cars after deletion:', writeError);
      throw writeError;
    }

    // Invalidate cache
    try {
      const cacheService = require('../services/cacheService');
      await cacheService.invalidatePattern('/api/cars:*');
      await cacheService.invalidate(cacheService.generateResourceKey('cars:availability', id));
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError.message);
    }

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    next(error);
  }
};

/**
 * Toggle maintenance mode
 */
const toggleMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid car ID' });
    }

    const { maintenanceMode, maintenanceUntil } = req.body;
    
    // Validate maintenance date if provided
    if (maintenanceUntil) {
      const date = new Date(maintenanceUntil);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid maintenance date format' });
      }
    }

    const cars = readCars();
    const carIndex = cars.findIndex(c => String(c.id) === String(id));
    
    if (carIndex === -1) {
      return res.status(404).json({ message: 'Car not found' });
    }

    cars[carIndex].maintenanceMode = maintenanceMode === true || maintenanceMode === 'true';
    cars[carIndex].maintenanceUntil = maintenanceUntil || null;
    
    // Write with error handling
    try {
      writeCars(cars);
    } catch (writeError) {
      console.error('Failed to write cars after maintenance update:', writeError);
      throw writeError;
    }

    // Invalidate cache
    try {
      const cacheService = require('../services/cacheService');
      await cacheService.invalidatePattern('/api/cars:*');
      await cacheService.invalidate(cacheService.generateResourceKey('cars:availability', id));
    } catch (cacheError) {
      console.error('Failed to invalidate cache:', cacheError.message);
    }

    res.json({ message: 'Maintenance mode updated', car: cars[carIndex] });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    next(error);
  }
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  toggleMaintenance,
};

