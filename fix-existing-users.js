const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./stalcraft.db');

console.log('Fixing existing users without stats/equipment/consumables...\n');

db.serialize(() => {
  // Get all users
  db.all('SELECT id, username FROM users', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }

    console.log(`Found ${users.length} users\n`);

    users.forEach(user => {
      // Check and create player_stats
      db.get('SELECT id FROM player_stats WHERE user_id = ?', [user.id], (err, stats) => {
        if (!stats) {
          db.run('INSERT INTO player_stats (user_id) VALUES (?)', [user.id], (err) => {
            if (err) {
              console.error(`Error creating stats for ${user.username}:`, err);
            } else {
              console.log(`✓ Created stats for ${user.username}`);
            }
          });
        }
      });

      // Check and create equipment
      db.get('SELECT id FROM equipment WHERE user_id = ?', [user.id], (err, equipment) => {
        if (!equipment) {
          db.run('INSERT INTO equipment (user_id) VALUES (?)', [user.id], (err) => {
            if (err) {
              console.error(`Error creating equipment for ${user.username}:`, err);
            } else {
              console.log(`✓ Created equipment for ${user.username}`);
            }
          });
        }
      });

      // Check and create consumables
      db.get('SELECT id FROM consumables WHERE user_id = ?', [user.id], (err, consumables) => {
        if (!consumables) {
          db.run('INSERT INTO consumables (user_id) VALUES (?)', [user.id], (err) => {
            if (err) {
              console.error(`Error creating consumables for ${user.username}:`, err);
            } else {
              console.log(`✓ Created consumables for ${user.username}`);
            }
          });
        }
      });
    });

    setTimeout(() => {
      console.log('\n✓ Fix complete! All users should now have stats/equipment/consumables.');
      db.close();
    }, 2000);
  });
});