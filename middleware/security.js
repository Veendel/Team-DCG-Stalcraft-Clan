const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

// ============================================
// RATE LIMITING
// ============================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many accounts created from this IP. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 200
});

// ============================================
// FAILED LOGIN TRACKING
// ============================================

const failedAttempts = new Map();

function trackFailedLogin(username) {
  const attempts = failedAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
  
  if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
    attempts.firstAttempt = Date.now();
  }
  
  attempts.count++;
  failedAttempts.set(username, attempts);
  
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
// EXPORTS
// ============================================

module.exports = {
  authLimiter,              // ← Must be defined
  apiLimiter,               // ← Must be defined
  registerLimiter,          // ← Must be defined
  speedLimiter,             // ← Must be defined
  validateRegistration,     // ← Must be defined
  validateLogin,            // ← Must be defined
  validateStats,            // ← Must be defined
  validateEquipment,        // ← Must be defined
  checkValidation,          // ← Must be defined
  checkBlacklist,           // ← Must be defined
  blacklistIP,              // ← Must be defined
  trackFailedLogin,         // ← Must be defined
  clearFailedAttempts,      // ← Must be defined
  isAccountLocked,          // ← Must be defined
  helmetConfig              // ← Must be defined
};