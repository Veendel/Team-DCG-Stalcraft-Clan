require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');
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
app.listen(PORT);


// ============================================
// SECURITY MIDDLEWARE (APPLIED FIRST!)
// ============================================

// Security headers
app.use(helmetConfig);

// Check IP blacklist
app.use(checkBlacklist);

// General speed limiter
app.use(speedLimiter);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files
app.use(express.static('public'));

// ============================================
// API ROUTES WITH RATE LIMITING
// ============================================

// Authentication routes (with strict rate limiting)
app.use('/api/auth', authRoutes);

// Admin & general API routes (with general rate limiting)
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   STALCRAFT Player Manager Server     ║
║   Running on http://localhost:${PORT}   ║
║                                        ║
║   🛡️  Security Features Active:       ║
║   ✓ Rate limiting                     ║
║   ✓ IP blacklisting                   ║
║   ✓ Input validation                  ║
║   ✓ Security headers (Helmet)         ║
║   ✓ Request size limits               ║
╚════════════════════════════════════════╝

Default Admin:
  Username: admin
  Password: admin123
  `);
});