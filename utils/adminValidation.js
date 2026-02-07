/**
 * Admin-specific validation functions
 */

/**
 * Validate car data for create/update operations
 */
const validateCarData = (data, isUpdate = false) => {
  const errors = [];

  // Required fields for create
  if (!isUpdate) {
    if (!data.make || typeof data.make !== 'string' || data.make.trim().length === 0) {
      errors.push('Make is required');
    }
    if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
      errors.push('Model is required');
    }
    if (!data.year || isNaN(parseInt(data.year))) {
      errors.push('Year is required and must be a number');
    }
    if (!data.pricePerDay || isNaN(parseFloat(data.pricePerDay)) || parseFloat(data.pricePerDay) < 0) {
      errors.push('Price per day is required and must be a positive number');
    }
    if (!data.seats || isNaN(parseInt(data.seats)) || parseInt(data.seats) < 2 || parseInt(data.seats) > 20) {
      errors.push('Seats must be between 2 and 20');
    }
    if (!data.transmission || !['Automatic', 'Manual'].includes(data.transmission)) {
      errors.push('Transmission must be Automatic or Manual');
    }
    if (!data.fuel || !['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(data.fuel)) {
      errors.push('Fuel type must be Petrol, Diesel, Electric, or Hybrid');
    }
  }

  // Validate year range
  if (data.year) {
    const year = parseInt(data.year);
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      errors.push(`Year must be between 1900 and ${currentYear + 1}`);
    }
  }

  // Validate price
  if (data.pricePerDay !== undefined) {
    const price = parseFloat(data.pricePerDay);
    if (isNaN(price) || price < 0 || price > 1000000) {
      errors.push('Price per day must be between 0 and 1,000,000');
    }
  }

  // Validate seats
  if (data.seats !== undefined) {
    const seats = parseInt(data.seats);
    if (isNaN(seats) || seats < 2 || seats > 20) {
      errors.push('Seats must be between 2 and 20');
    }
  }

  // Validate transmission
  if (data.transmission && !['Automatic', 'Manual'].includes(data.transmission)) {
    errors.push('Transmission must be Automatic or Manual');
  }

  // Validate fuel type
  if (data.fuel && !['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(data.fuel)) {
    errors.push('Fuel type must be Petrol, Diesel, Electric, or Hybrid');
  }

  // Validate tags (if provided)
  if (data.tags) {
    if (!Array.isArray(data.tags) && typeof data.tags !== 'string') {
      errors.push('Tags must be an array or comma-separated string');
    }
  }

  // Validate maintenance date
  if (data.maintenanceUntil) {
    const date = new Date(data.maintenanceUntil);
    if (isNaN(date.getTime())) {
      errors.push('Invalid maintenance date format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize string input (prevent XSS)
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 500); // Limit length
};

/**
 * Sanitize car data
 */
const sanitizeCarData = (data) => {
  const sanitized = { ...data };

  if (sanitized.make) sanitized.make = sanitizeString(sanitized.make);
  if (sanitized.model) sanitized.model = sanitizeString(sanitized.model);
  if (sanitized.mileage) sanitized.mileage = sanitizeString(sanitized.mileage);
  if (sanitized.fuelPolicy) sanitized.fuelPolicy = sanitizeString(sanitized.fuelPolicy);

  // Sanitize tags
  if (sanitized.tags) {
    if (typeof sanitized.tags === 'string') {
      sanitized.tags = sanitized.tags.split(',').map(t => sanitizeString(t)).filter(t => t.length > 0);
    } else if (Array.isArray(sanitized.tags)) {
      sanitized.tags = sanitized.tags.map(t => sanitizeString(String(t))).filter(t => t.length > 0);
    }
  }

  return sanitized;
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, pageSize, maxPageSize = 100) => {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.max(1, Math.min(maxPageSize, parseInt(pageSize) || 20));
  return { page: p, pageSize: ps };
};

/**
 * Validate file upload
 */
const validateFileUpload = (file, maxSize = 5 * 1024 * 1024) => {
  const errors = [];

  if (!file) {
    return { valid: true }; // File is optional
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = require('path').extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    errors.push('Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCarData,
  sanitizeCarData,
  sanitizeString,
  validatePagination,
  validateFileUpload,
};

