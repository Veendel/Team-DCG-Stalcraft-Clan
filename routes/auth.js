const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const router = express.Router();

const {
  authLimiter,
  registerLimiter,
  trackFailedLogin,
  clearFailedAttempts,
  isAccountLocked
} = require('../middleware/security');

// ============================================
// REGISTER
// ============================================

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );

    const userId = result.rows[0].id;

    await pool.query('INSERT INTO player_stats (user_id) VALUES ($1)', [userId]);
    await pool.query('INSERT INTO equipment (user_id) VALUES ($1)', [userId]);
    await pool.query('INSERT INTO consumables (user_id) VALUES ($1)', [userId]);

    console.log(`✓ New user registered: ${username} (ID: ${userId})`);
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// LOGIN
// ============================================

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (isAccountLocked(username)) {
      return res.status(429).json({ 
        error: 'Account temporarily locked. Try again in 15 minutes.' 
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      trackFailedLogin(username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const isLocked = trackFailedLogin(username);
      
      if (isLocked) {
        return res.status(429).json({ 
          error: 'Too many failed attempts. Account locked for 15 minutes.' 
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    clearFailedAttempts(username);

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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;