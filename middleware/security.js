const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

// ============================================
// RATE LIMITING - PRODUCTION SETTINGS
// ============================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 login attempts
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 registrations per hour
  message: { error: 'Too many accounts created from this IP. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests at full speed
  delayMs: 200 // Add 200ms delay per request after that
});

// ============================================
// FAILED LOGIN TRACKING
// ============================================

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
    return true;
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
// IP BLACKLIST
// ============================================

const ipBlacklist = new Set();

function blacklistIP(ip) {
  ipBlacklist.add(ip);
  console.log(`⚠️  IP ${ip} has been blacklisted`);
}

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
// HELMET SECURITY HEADERS
// ============================================

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// ============================================
// EXPORTS (NO VALIDATION FUNCTIONS)
// ============================================

module.exports = {
  authLimiter,
  apiLimiter,
  registerLimiter,
  speedLimiter,
  checkBlacklist,
  blacklistIP,
  trackFailedLogin,
  clearFailedAttempts,
  isAccountLocked,
  helmetConfig
};