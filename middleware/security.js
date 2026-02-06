const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// ============================================
// RATE LIMITING
// ============================================

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Registration rate limiter (prevents mass account creation)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 3 registrations per hour per IP
  message: {
    error: 'Too many accounts created. Please try again in 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiter (slows down repeated requests)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests at full speed
  delayMs: 500 // Add 500ms delay per request after that
});

// ============================================
// INPUT VALIDATION
// ============================================

// Validate registration input
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore, and dash')
    .escape(),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validate login input
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .escape(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validate stats update
const validateStats = [
  body('faction')
    .optional()
    .isIn(['Loner', 'Bandit', 'Duty', 'Freedom', 'Ecologist', 'Mercenary'])
    .withMessage('Invalid faction'),
  
  body('level')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Level must be between 1 and 100'),
  
  body('money')
    .optional()
    .isInt({ min: 0, max: 999999999 })
    .withMessage('Invalid money amount'),
  
  body('kills')
    .optional()
    .isInt({ min: 0, max: 999999 })
    .withMessage('Invalid kills amount'),
  
  body('deaths')
    .optional()
    .isInt({ min: 0, max: 999999 })
    .withMessage('Invalid deaths amount')
];

// Validate equipment update
const validateEquipment = [
  body('weapon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Weapon name too long')
    .escape(),
  
  body('armor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Armor name too long')
    .escape(),
  
  body('helmet')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Helmet name too long')
    .escape(),
  
  body('artifact')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Artifact name too long')
    .escape()
];

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: errors.array()[0].msg 
    });
  }
  next();
};

// ============================================
// IP BLACKLIST
// ============================================

// Simple in-memory blacklist (use database in production)
const ipBlacklist = new Set();

// Add IP to blacklist
function blacklistIP(ip) {
  ipBlacklist.add(ip);
  console.log(`⚠️  IP ${ip} has been blacklisted`);
}

// Check if IP is blacklisted
const checkBlacklist = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (ipBlacklist.has(ip)) {
    return res.status(403).json({ 
      error: 'Your IP has been blocked due to suspicious activity.' 
    });
  }
  
  next();
};

// ============================================
// FAILED LOGIN TRACKING
// ============================================

// Track failed login attempts per username
const failedAttempts = new Map();

function trackFailedLogin(username) {
  const attempts = failedAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
  
  // Reset counter after 15 minutes
  if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
    attempts.firstAttempt = Date.now();
  }
  
  attempts.count++;
  failedAttempts.set(username, attempts);
  
  // Lock account after 5 failed attempts
  if (attempts.count >= 5) {
    console.log(`⚠️  Account locked: ${username} (too many failed attempts)`);
    return true; // Account is locked
  }
  
  return false;
}

function clearFailedAttempts(username) {
  failedAttempts.delete(username);
}

function isAccountLocked(username) {
  const attempts = failedAttempts.get(username);
  if (!attempts) return false;
  
  // Reset after 15 minutes
  if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    failedAttempts.delete(username);
    return false;
  }
  
  return attempts.count >= 5;
}

// ============================================
// HELMET SECURITY HEADERS
// ============================================

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow base64 and blob images
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  registerLimiter,
  speedLimiter,
  validateRegistration,
  validateLogin,
  validateStats,
  validateEquipment,
  checkValidation,
  checkBlacklist,
  blacklistIP,
  trackFailedLogin,
  clearFailedAttempts,
  isAccountLocked,
  helmetConfig
};