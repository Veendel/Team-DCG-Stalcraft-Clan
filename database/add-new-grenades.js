require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addNewGrenades() {
  const client = await pool.connect();
  
  try {
    console.log('Adding new grenade columns...\n');

    // Add Tarmac
    await client.query(`
      ALTER TABLE consumables 
      ADD COLUMN IF NOT EXISTS nade_tarmac INTEGER DEFAULT 0
    `);
    console.log('✓ Added nade_tarmac column');

    // Add Sickness
    await client.query(`
      ALTER TABLE consumables 
      ADD COLUMN IF NOT EXISTS nade_sickness INTEGER DEFAULT 0
    `);
    console.log('✓ Added nade_sickness column');

    // Add Stinky
    await client.query(`
      ALTER TABLE consumables 
      ADD COLUMN IF NOT EXISTS nade_stinky INTEGER DEFAULT 0
    `);
    console.log('✓ Added nade_stinky column');

    console.log('\n✓ Migration complete! All new grenade columns added.');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addNewGrenades();