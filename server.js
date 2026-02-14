require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database/db'); // PostgreSQL, not SQLite
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { 
  apiLimiter, 
  speedLimiter, 
  checkBlacklist,
  helmetConfig 
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE (APPLIED FIRST!)
// ============================================

app.use(helmetConfig);
app.use(checkBlacklist);
app.use(speedLimiter);

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static('public'));

// ============================================
// API ROUTES
// ============================================

// Authentication routes (NO EXTRA MIDDLEWARE HERE)
app.use('/api/auth', authRoutes);

// Admin routes with rate limiting
app.use('/api', apiLimiter, adminRoutes);

// ============================================
// SERVE HTML FILES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
// Authentication routes
app.use('/api/auth', authRoutes);

// TEMPORARILY COMMENT OUT ADMIN ROUTES TO TEST
// app.use('/api', apiLimiter, adminRoutes);
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   STALCRAFT Player Manager Server     ║
║   Running on http://localhost:${PORT}  ║
╚════════════════════════════════════════╝
  `);
});