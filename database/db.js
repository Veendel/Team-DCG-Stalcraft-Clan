const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ingame_name TEXT,
      discord_name TEXT,
      kills INTEGER DEFAULT 0,
      deaths INTEGER DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weapons TEXT,
      armors TEXT,
      artifact_builds TEXT,
      artifact_image TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consumables (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      bonus_stomp BOOLEAN DEFAULT FALSE,
      bonus_strike BOOLEAN DEFAULT FALSE
    )
  `);

  // Create default admin (idempotent)
  const adminPassword = await bcrypt.hash('KiralyAdmin54', 10);

  await pool.query(`
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, 'admin')
    ON CONFLICT (username) DO NOTHING
  `, ['admin', adminPassword]);

  console.log('✓ Database initialized');
};

initDb().catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});

module.exports = pool;
