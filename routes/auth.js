const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const router = express.Router();
const {
  authLimiter,
  registerLimiter,
  validateRegistration,
  validateLogin,
  checkValidation,
  trackFailedLogin,
  clearFailedAttempts,
  isAccountLocked
} = require('../middleware/security');

// ============================================
// REGISTER NEW USER
// ============================================

// REGISTER NEW USER
router.post('/register', 
  registerLimiter,
  validateRegistration,
  checkValidation,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Check if username already exists
      db.get(
        'SELECT username FROM users WHERE username = ?',
        [username],
        async (err, existingUser) => {
          if (err) {
            return res.status(500).json({ error: 'Server error' });
          }

          if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert user
          db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            function(err) {
              if (err) {
                console.error('Registration error:', err);
                return res.status(500).json({ error: 'Registration failed' });
              }

              const userId = this.lastID;

              // Create default player stats
              db.run('INSERT INTO player_stats (user_id) VALUES (?)', [userId], (err) => {
                if (err) console.error('Error creating player_stats:', err);
              });

              // Create default equipment
              db.run('INSERT INTO equipment (user_id) VALUES (?)', [userId], (err) => {
                if (err) console.error('Error creating equipment:', err);
              });

              // Create default consumables
              db.run('INSERT INTO consumables (user_id) VALUES (?)', [userId], (err) => {
                if (err) console.error('Error creating consumables:', err);
              });

              console.log(`✓ New user registered: ${username} (ID: ${userId})`);
              res.status(201).json({ message: 'User registered successfully' });
            }
          );
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ============================================
// LOGIN
// ============================================

router.post('/login',
  authLimiter, // Strict rate limiting
  validateLogin, // Validate input
  checkValidation, // Check for validation errors
  (req, res) => {
    const { username, password } = req.body;

    // Check if account is locked
    if (isAccountLocked(username)) {
      return res.status(429).json({ 
        error: 'Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.' 
      });
    }

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
          trackFailedLogin(username);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          const isLocked = trackFailedLogin(username);
          
          if (isLocked) {
            return res.status(429).json({ 
              error: 'Too many failed login attempts. Account locked for 15 minutes.' 
            });
          }
          
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(username);

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log(`✓ User logged in: ${username}`);

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      }
    );
  }
);

module.exports = router;