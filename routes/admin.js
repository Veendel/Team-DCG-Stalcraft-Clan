const express = require('express');
const db = require('../database/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateStats, validateEquipment, checkValidation } = require('../middleware/security');
const router = express.Router();

// ============================================
// GET ALL USERS WITH COMPLETE DATA
// ============================================

router.get('/users', verifyToken, verifyAdmin, (req, res) => {
  console.log('Admin requesting all users data...');
  
  db.all(
    `SELECT 
      u.id, 
      u.username, 
      u.role, 
      u.created_at,
      p.ingame_name,
      p.discord_name,
      p.kills, 
      p.deaths,
      e.weapons,
      e.armors,
      e.artifact_builds,
      e.artifact_image,
      c.nade_plantain,
      c.nade_napalm,
      c.nade_thunder,
      c.nade_frost,
      c.enh_solyanka,
      c.enh_garlic_soup,
      c.enh_pea_soup,
      c.enh_lingonberry,
      c.enh_frosty,
      c.enh_alcobull,
      c.enh_geyser_vodka,
      c.mob_grog,
      c.mob_strength_stimulator,
      c.mob_neurotonic,
      c.mob_battery,
      c.mob_salt,
      c.mob_atlas,
      c.short_painkiller,
      c.short_schizoyorsh,
      c.short_morphine,
      c.short_epinephrine,
      c.bonus_stomp,
      c.bonus_strike
     FROM users u
     LEFT JOIN player_stats p ON u.id = p.user_id
     LEFT JOIN equipment e ON u.id = e.user_id
     LEFT JOIN consumables c ON u.id = c.user_id
     ORDER BY u.id ASC`,
    [],
    (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      
      console.log(`✓ Returning ${users.length} users with complete data`);
      res.json(users);
    }
  );
});

// ============================================
// DELETE USER
// ============================================

router.delete('/users/:id', verifyToken, verifyAdmin, (req, res) => {
  const userId = req.params.id;

  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// ============================================
// GET PLAYER STATS
// ============================================

router.get('/stats/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    'SELECT * FROM player_stats WHERE user_id = ?',
    [userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }
      res.json(stats || {});
    }
  );
});

// ============================================
// UPDATE PLAYER STATS
// ============================================

router.put('/stats/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;
  const { ingame_name, discord_name, kills, deaths } = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if stats exist
  db.get('SELECT id FROM player_stats WHERE user_id = ?', [userId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Update existing stats
      db.run(
        `UPDATE player_stats 
         SET ingame_name = ?, discord_name = ?, kills = ?, deaths = ?
         WHERE user_id = ?`,
        [ingame_name, discord_name, kills, deaths, userId],
        function(err) {
          if (err) {
            console.error('Error updating stats:', err);
            return res.status(500).json({ error: 'Failed to update stats' });
          }
          res.json({ message: 'Stats updated successfully' });
        }
      );
    } else {
      // Insert new stats
      db.run(
        `INSERT INTO player_stats (user_id, ingame_name, discord_name, kills, deaths)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, ingame_name, discord_name, kills, deaths],
        function(err) {
          if (err) {
            console.error('Error inserting stats:', err);
            return res.status(500).json({ error: 'Failed to create stats' });
          }
          res.json({ message: 'Stats created successfully' });
        }
      );
    }
  });
});

// ============================================
// GET EQUIPMENT
// ============================================

router.get('/equipment/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    'SELECT * FROM equipment WHERE user_id = ?',
    [userId],
    (err, equipment) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch equipment' });
      }
      res.json(equipment || {});
    }
  );
});

// ============================================
// UPDATE EQUIPMENT
// ============================================

router.put('/equipment/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;
  const { weapons, armors, artifact_builds, artifact_image } = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if equipment exists
  db.get('SELECT id FROM equipment WHERE user_id = ?', [userId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Update existing equipment
      db.run(
        `UPDATE equipment 
         SET weapons = ?, armors = ?, artifact_builds = ?, artifact_image = ?
         WHERE user_id = ?`,
        [weapons, armors, artifact_builds, artifact_image || null, userId],
        function(err) {
          if (err) {
            console.error('Error updating equipment:', err);
            return res.status(500).json({ error: 'Failed to update equipment' });
          }
          res.json({ message: 'Equipment updated successfully' });
        }
      );
    } else {
      // Insert new equipment
      db.run(
        `INSERT INTO equipment (user_id, weapons, armors, artifact_builds, artifact_image)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, weapons, armors, artifact_builds, artifact_image || null],
        function(err) {
          if (err) {
            console.error('Error inserting equipment:', err);
            return res.status(500).json({ error: 'Failed to create equipment' });
          }
          res.json({ message: 'Equipment created successfully' });
        }
      );
    }
  });
});

// ============================================
// GET CONSUMABLES
// ============================================

router.get('/consumables/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    'SELECT * FROM consumables WHERE user_id = ?',
    [userId],
    (err, consumables) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch consumables' });
      }
      res.json(consumables || {});
    }
  );
});

// ============================================
// UPDATE CONSUMABLES
// ============================================

router.put('/consumables/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;
  const consumables = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if consumables exist
  db.get('SELECT id FROM consumables WHERE user_id = ?', [userId], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      // Update existing consumables
      db.run(
        `UPDATE consumables SET
         nade_plantain = ?, nade_napalm = ?, nade_thunder = ?, nade_frost = ?,
         enh_solyanka = ?, enh_garlic_soup = ?, enh_pea_soup = ?, enh_lingonberry = ?,
         enh_frosty = ?, enh_alcobull = ?, enh_geyser_vodka = ?,
         mob_grog = ?, mob_strength_stimulator = ?, mob_neurotonic = ?, mob_battery = ?,
         mob_salt = ?, mob_atlas = ?,
         short_painkiller = ?, short_schizoyorsh = ?, short_morphine = ?, short_epinephrine = ?,
         bonus_stomp = ?, bonus_strike = ?
         WHERE user_id = ?`,
        [
          consumables.nade_plantain, consumables.nade_napalm, consumables.nade_thunder, consumables.nade_frost,
          consumables.enh_solyanka, consumables.enh_garlic_soup, consumables.enh_pea_soup, consumables.enh_lingonberry,
          consumables.enh_frosty, consumables.enh_alcobull, consumables.enh_geyser_vodka,
          consumables.mob_grog, consumables.mob_strength_stimulator, consumables.mob_neurotonic, consumables.mob_battery,
          consumables.mob_salt, consumables.mob_atlas,
          consumables.short_painkiller, consumables.short_schizoyorsh, consumables.short_morphine, consumables.short_epinephrine,
          consumables.bonus_stomp, consumables.bonus_strike,
          userId
        ],
        function(err) {
          if (err) {
            console.error('Error updating consumables:', err);
            return res.status(500).json({ error: 'Failed to update consumables' });
          }
          res.json({ message: 'Consumables updated successfully' });
        }
      );
    } else {
      // Insert new consumables
      db.run(
        `INSERT INTO consumables (
          user_id, nade_plantain, nade_napalm, nade_thunder, nade_frost,
          enh_solyanka, enh_garlic_soup, enh_pea_soup, enh_lingonberry,
          enh_frosty, enh_alcobull, enh_geyser_vodka,
          mob_grog, mob_strength_stimulator, mob_neurotonic, mob_battery,
          mob_salt, mob_atlas,
          short_painkiller, short_schizoyorsh, short_morphine, short_epinephrine,
          bonus_stomp, bonus_strike
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          consumables.nade_plantain, consumables.nade_napalm, consumables.nade_thunder, consumables.nade_frost,
          consumables.enh_solyanka, consumables.enh_garlic_soup, consumables.enh_pea_soup, consumables.enh_lingonberry,
          consumables.enh_frosty, consumables.enh_alcobull, consumables.enh_geyser_vodka,
          consumables.mob_grog, consumables.mob_strength_stimulator, consumables.mob_neurotonic, consumables.mob_battery,
          consumables.mob_salt, consumables.mob_atlas,
          consumables.short_painkiller, consumables.short_schizoyorsh, consumables.short_morphine, consumables.short_epinephrine,
          consumables.bonus_stomp, consumables.bonus_strike
        ],
        function(err) {
          if (err) {
            console.error('Error inserting consumables:', err);
            return res.status(500).json({ error: 'Failed to create consumables' });
          }
          res.json({ message: 'Consumables created successfully' });
        }
      );
    }
  });
});

module.exports = router;