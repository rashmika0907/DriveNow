/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  return password && password.length >= 8;
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  if (start < today) {
    return { valid: false, message: 'Start date cannot be in the past' };
  }

  if (end <= start) {
    return { valid: false, message: 'End date must be after start date' };
  }

  return { valid: true };
};

/**
 * Validate Indian Driving License number
 * Format: 2 letters (state code) + 2 digits (RTO/YY) + 4-11 alphanumeric
 * Examples: DL-0120141234567, DL0120141234567, MH14 2011 0051096
 */
const validateDLNumber = (dlNumber) => {
  if (!dlNumber || typeof dlNumber !== 'string') {
    return { valid: false, message: 'Driving license number is required' };
  }

  const cleaned = dlNumber.trim().toUpperCase().replace(/\s+/g, '');

  // Remove common separators
  const normalized = cleaned.replace(/[-_]/g, '');

  // Indian DL format: 2 letters (state) + 2 digits (RTO/YY) + 4-11 alphanumeric (total max 15 chars)
  // Accept separators like hyphen/underscore/space (removed in normalization)
  // Examples: DL0120141234567, MH14 2011 0051096, DL-01-2014-1234567, KA01AB1234567
  const dlPattern = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,11}$/; // max 15 chars including the first 4

  if (!dlPattern.test(normalized)) {
    return { 
      valid: false, 
      message: 'Invalid driving license format. Format: 2 letters + 2 digits + 4-11 alphanumeric (e.g., DL0120141234567)' 
    };
  }

  // Check if it starts with valid state codes (common ones)
  const stateCodes = ['DL', 'MH', 'KA', 'TN', 'AP', 'GJ', 'RJ', 'UP', 'WB', 'PB', 'HR', 'MP', 'OR', 'KL', 'BR', 'AS', 'JH', 'CG', 'UT', 'HP', 'TR', 'GA', 'MN', 'NL', 'AR', 'SK', 'LA', 'AN'];
  const stateCode = normalized.substring(0, 2);
  
  if (!stateCodes.includes(stateCode)) {
    // Warn but don't fail - might be a new state code
    console.warn('Unrecognized state code in DL:', stateCode);
  }

  return { valid: true, normalized };
};

/**
 * Validate DL expiry date
 */
const validateDLExpiry = (expiryDate) => {
  if (!expiryDate) {
    return { valid: false, message: 'Driving license expiry date is required' };
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(expiry.getTime())) {
    return { valid: false, message: 'Invalid expiry date format' };
  }

  if (expiry < today) {
    return { valid: false, message: 'Driving license has expired. Please renew your license.' };
  }

  return { valid: true };
};

module.exports = { 
  validateEmail, 
  validatePassword, 
  validateDateRange,
  validateDLNumber,
  validateDLExpiry,
};

