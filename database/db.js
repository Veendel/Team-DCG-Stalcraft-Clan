const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'team_dcg',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.stack);
  } else {
    console.log('✓ Connected to PostgreSQL database');
    release();
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Player stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ingame_name VARCHAR(100),
        discord_name VARCHAR(100),
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0
      )
    `);

    // Equipment table
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weapons TEXT,
        armors TEXT,
        artifact_builds TEXT,
        artifact_image TEXT
      )
    `);

    // Consumables table (STRIKE and STOMP now countable)
    await client.query(`
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
        bonus_stomp INTEGER DEFAULT 0,
        bonus_strike INTEGER DEFAULT 0
      )
    `);

    // Clan war registration table (NEW - resets daily)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clan_war_registration (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        registered BOOLEAN DEFAULT FALSE,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        registration_date DATE DEFAULT CURRENT_DATE,
        UNIQUE(user_id, registration_date)
      )
    `);

    // Clan strats images table (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS clan_strats (
        id SERIAL PRIMARY KEY,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        image_data TEXT NOT NULL,
        title VARCHAR(200),
        description TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');

    // Create default admin user
    const adminCheck = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (adminCheck.rows.length === 0) {
      const adminPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
      );

      const result = await client.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
        ['admin', adminPassword, 'admin']
      );
      
      const adminId = result.rows[0].id;

      // Create default records for admin
      await client.query('INSERT INTO player_stats (user_id) VALUES ($1)', [adminId]);
      await client.query('INSERT INTO equipment (user_id) VALUES ($1)', [adminId]);
      await client.query('INSERT INTO consumables (user_id) VALUES ($1)', [adminId]);
      
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
};

// Initialize database
initializeDatabase();

module.exports = pool;
