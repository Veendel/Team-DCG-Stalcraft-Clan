const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// ============================================
// RATE LIMITING - PRODUCTION SETTINGS
// ============================================

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Allow 15 login attempts (typos happen!)
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  // Store in memory - reset on server restart
  // For production with multiple servers, use Redis
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute (generous for normal use)
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Registration rate limiter (PRODUCTION - allows clan signups)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Allow 20 registrations per hour (entire clan can sign up)
  message: {
    error: 'Too many accounts created from this IP. Please try again in 1 hour. Contact admin if this is an error.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Optional: Skip for known safe IPs
  skip: (req) => {
    // If you have a static IP for your clan Discord/meeting place, add it here
    const trustedIPs = []; 
    return trustedIPs.includes(req.ip);
  }
});

// Speed limiter (slows down repeated requests instead of blocking)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests at full speed
  delayMs: 200 // Add 200ms delay per request after that (was 500ms - too slow)
});

// Keep the rest of the security.js file the same...
