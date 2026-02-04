const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db'); // Now a pg.Pool
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

router.post('/register', 
  registerLimiter,
  validateRegistration,
  checkValidation,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Check if username already exists
      const existingResult = await db.query('SELECT username FROM users WHERE username = $1', [username]);
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction for atomic inserts
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Insert user
        const userResult = await client.query(
          'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
          [username, hashedPassword]
        );
        const userId = userResult.rows[0].id;

        // Create default player stats
        await client.query('INSERT INTO player_stats (user_id) VALUES ($1)', [userId]);

        // Create default equipment
        await client.query('INSERT INTO equipment (user_id) VALUES ($1)', [userId]);

        // Create default consumables
        await client.query('INSERT INTO consumables (user_id) VALUES ($1)', [userId]);

        await client.query('COMMIT');

        console.log(`✓ New user registered: ${username} (ID: ${userId})`);
        res.status(201).json({ message: 'User registered successfully' });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
      } finally {
        client.release();
      }
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
  async (req, res) => {
    const { username, password } = req.body;

    // Check if account is locked
    if (isAccountLocked(username)) {
      return res.status(429).json({ 
        error: 'Account temporarily locked due to too many failed login attempts. Try again in 15 minutes.' 
      });
    }

    try {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];

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
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
