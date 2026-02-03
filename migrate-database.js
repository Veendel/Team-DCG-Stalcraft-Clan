const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./stalcraft.db');

console.log('Starting database migration...\n');

db.serialize(() => {
  // Drop old tables
  console.log('Dropping old tables...');
  db.run('DROP TABLE IF EXISTS player_stats');
  db.run('DROP TABLE IF EXISTS equipment');
  
  // Create new player_stats table
  console.log('Creating new player_stats table...');
  db.run(`
    CREATE TABLE player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ingame_name TEXT,
      discord_name TEXT,
      kills INTEGER DEFAULT 0,
      deaths INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create new equipment table
  console.log('Creating new equipment table...');
  db.run(`
    CREATE TABLE equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weapons TEXT,
      armors TEXT,
      artifact_builds TEXT,
      artifact_image TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create consumables table
  console.log('Creating consumables table...');
  db.run(`
    CREATE TABLE consumables (
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
  `, () => {
    console.log('\n✓ Migration complete!');
    console.log('✓ All tables recreated successfully');
    console.log('\nNote: All old player data has been reset.');
    console.log('Users will need to re-enter their stats.\n');
    db.close();
  });
});