const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '../stalcraft.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✓ Connected to SQLite database');
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Player stats table (UPDATED)
  db.run(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ingame_name TEXT,
      discord_name TEXT,
      kills INTEGER DEFAULT 0,
      deaths INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Equipment table (UPDATED)
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weapons TEXT,
      armors TEXT,
      artifact_builds TEXT,
      artifact_image TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Consumables table (NEW)
  db.run(`
    CREATE TABLE IF NOT EXISTS consumables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nade_plantain INTEGER DEFAULT 0,
      nade_napalm INTEGER DEFAULT 0,
      nade_thunder INTEGER DEFAULT 0,
      nade_frost INTEGER DEFAULT 0,
      enh_solyanka INTEGER DEFAULT 0,
      enh_garlic_soup INTEGER DEFAULT 0,
      enh_pea_soup INTEGER DEFAULT 0,
      enh_lingonberry INTEGER DEFAULT 0,
      enh_frosty INTEGER DEFAULT 0,
      enh_alcobull INTEGER DEFAULT 0,
      enh_geyser_vodka INTEGER DEFAULT 0,
      mob_grog INTEGER DEFAULT 0,
      mob_strength_stimulator INTEGER DEFAULT 0,
      mob_neurotonic INTEGER DEFAULT 0,
      mob_battery INTEGER DEFAULT 0,
      mob_salt INTEGER DEFAULT 0,
      mob_atlas INTEGER DEFAULT 0,
      short_painkiller INTEGER DEFAULT 0,
      short_schizoyorsh INTEGER DEFAULT 0,
      short_morphine INTEGER DEFAULT 0,
      short_epinephrine INTEGER DEFAULT 0,
      bonus_stomp BOOLEAN DEFAULT 0,
      bonus_strike BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role) 
    VALUES ('admin', ?, 'admin')
  `, [adminPassword], function(err) {
    if (!err && this.changes > 0) {
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }
  });
});

module.exports = db;