const mongoose = require('mongoose');

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required and must be a string' };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(', ')
  };
};

// Validate URL format
const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate date format and range
const validateDate = (date, { minDate, maxDate } = {}) => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Invalid date format' };
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { isValid: false, message: `Date must be after ${minDate}` };
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { isValid: false, message: `Date must be before ${maxDate}` };
  }

  return { isValid: true };
};

// Validate numeric value with range
const validateNumber = (value, { min, max, integer = false } = {}) => {
  const number = Number(value);

  if (isNaN(number)) {
    return { isValid: false, message: 'Value must be a number' };
  }

  if (integer && !Number.isInteger(number)) {
    return { isValid: false, message: 'Value must be an integer' };
  }

  if (min !== undefined && number < min) {
    return { isValid: false, message: `Value must be greater than or equal to ${min}` };
  }

  if (max !== undefined && number > max) {
    return { isValid: false, message: `Value must be less than or equal to ${max}` };
  }

  return { isValid: true };
};

// Validate file type and size
const validateFile = (file, { allowedTypes, maxSize }) => {
  if (!file) {
    return { isValid: false, message: 'No file provided' };
  }

  const errors = [];

  if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  if (maxSize && file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(', ')
  };
};

// Sanitize string input
const sanitizeString = (str, maxLength) => {
  if (typeof str !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  
  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Truncate if maxLength is specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

module.exports = {
  validateObjectId,
  validateEmail,
  validatePassword,
  validateURL,
  validateDate,
  validateNumber,
  validateFile,
  sanitizeString
}; 