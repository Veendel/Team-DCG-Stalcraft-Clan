const express = require('express');
const db = require('../database/db'); // Now a pg.Pool
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateStats, validateEquipment, checkValidation } = require('../middleware/security');
const router = express.Router();

// ============================================
// GET ALL USERS WITH COMPLETE DATA
// ============================================

router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  console.log('Admin requesting all users data...');
  
  try {
    const query = `
      SELECT 
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
       ORDER BY u.id ASC
    `;
    
    const result = await db.query(query);
    console.log(`✓ Returning ${result.rows.length} users with complete data`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================
// DELETE USER
// ============================================

router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// GET PLAYER STATS
// ============================================

router.get('/stats/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await db.query('SELECT * FROM player_stats WHERE user_id = $1', [userId]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// UPDATE PLAYER STATS
// ============================================

router.put('/stats/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const { ingame_name, discord_name, kills, deaths } = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Check if stats exist
    const existing = await client.query('SELECT id FROM player_stats WHERE user_id = $1', [userId]);
    
    if (existing.rows.length > 0) {
      // Update existing stats
      await client.query(
        `UPDATE player_stats 
         SET ingame_name = $1, discord_name = $2, kills = $3, deaths = $4
         WHERE user_id = $5`,
        [ingame_name, discord_name, kills, deaths, userId]
      );
      res.json({ message: 'Stats updated successfully' });
    } else {
      // Insert new stats
      await client.query(
        `INSERT INTO player_stats (user_id, ingame_name, discord_name, kills, deaths)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, ingame_name, discord_name, kills, deaths]
      );
      res.json({ message: 'Stats created successfully' });
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating/inserting stats:', err);
    res.status(500).json({ error: 'Failed to update/create stats' });
  } finally {
    client.release();
  }
});

// ============================================
// GET EQUIPMENT
// ============================================

router.get('/equipment/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await db.query('SELECT * FROM equipment WHERE user_id = $1', [userId]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// ============================================
// UPDATE EQUIPMENT
// ============================================

router.put('/equipment/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const { weapons, armors, artifact_builds, artifact_image } = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Check if equipment exists
    const existing = await client.query('SELECT id FROM equipment WHERE user_id = $1', [userId]);
    
    if (existing.rows.length > 0) {
      // Update existing equipment
      await client.query(
        `UPDATE equipment 
         SET weapons = $1, armors = $2, artifact_builds = $3, artifact_image = $4
         WHERE user_id = $5`,
        [weapons, armors, artifact_builds, artifact_image || null, userId]
      );
      res.json({ message: 'Equipment updated successfully' });
    } else {
      // Insert new equipment
      await client.query(
        `INSERT INTO equipment (user_id, weapons, armors, artifact_builds, artifact_image)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, weapons, armors, artifact_builds, artifact_image || null]
      );
      res.json({ message: 'Equipment created successfully' });
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating/inserting equipment:', err);
    res.status(500).json({ error: 'Failed to update/create equipment' });
  } finally {
    client.release();
  }
});

// ============================================
// GET CONSUMABLES
// ============================================

router.get('/consumables/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const result = await db.query('SELECT * FROM consumables WHERE user_id = $1', [userId]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching consumables:', err);
    res.status(500).json({ error: 'Failed to fetch consumables' });
  }
});

// ============================================
// UPDATE CONSUMABLES
// ============================================

router.put('/consumables/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const consumables = req.body;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Check if consumables exist
    const existing = await client.query('SELECT id FROM consumables WHERE user_id = $1', [userId]);
    
    if (existing.rows.length > 0) {
      // Update existing consumables
      await client.query(
        `UPDATE consumables SET
         nade_plantain = $1, nade_napalm = $2, nade_thunder = $3, nade_frost = $4,
         enh_solyanka = $5, enh_garlic_soup = $6, enh_pea_soup = $7, enh_lingonberry = $8,
         enh_frosty = $9, enh_alcobull = $10, enh_geyser_vodka = $11,
         mob_grog = $12, mob_strength_stimulator = $13, mob_neurotonic = $14, mob_battery = $15,
         mob_salt = $16, mob_atlas = $17,
         short_painkiller = $18, short_schizoyorsh = $19, short_morphine = $20, short_epinephrine = $21,
         bonus_stomp = $22, bonus_strike = $23
         WHERE user_id = $24`,
        [
          consumables.nade_plantain, consumables.nade_napalm, consumables.nade_thunder, consumables.nade_frost,
          consumables.enh_solyanka, consumables.enh_garlic_soup, consumables.enh_pea_soup, consumables.enh_lingonberry,
          consumables.enh_frosty, consumables.enh_alcobull, consumables.enh_geyser_vodka,
          consumables.mob_grog, consumables.mob_strength_stimulator, consumables.mob_neurotonic, consumables.mob_battery,
          consumables.mob_salt, consumables.mob_atlas,
          consumables.short_painkiller, consumables.short_schizoyorsh, consumables.short_morphine, consumables.short_epinephrine,
          consumables.bonus_stomp, consumables.bonus_strike,
          userId
        ]
      );
      res.json({ message: 'Consumables updated successfully' });
    } else {
      // Insert new consumables
      await client.query(
        `INSERT INTO consumables (
          user_id, nade_plantain, nade_napalm, nade_thunder, nade_frost,
          enh_solyanka, enh_garlic_soup, enh_pea_soup, enh_lingonberry,
          enh_frosty, enh_alcobull, enh_geyser_vodka,
          mob_grog, mob_strength_stimulator, mob_neurotonic, mob_battery,
          mob_salt, mob_atlas,
          short_painkiller, short_schizoyorsh, short_morphine, short_epinephrine,
          bonus_stomp, bonus_strike
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          userId,
          consumables.nade_plantain, consumables.nade_napalm, consumables.nade_thunder, consumables.nade_frost,
          consumables.enh_solyanka, consumables.enh_garlic_soup, consumables.enh_pea_soup, consumables.enh_lingonberry,
          consumables.enh_frosty, consumables.enh_alcobull, consumables.enh_geyser_vodka,
          consumables.mob_grog, consumables.mob_strength_stimulator, consumables.mob_neurotonic, consumables.mob_battery,
          consumables.mob_salt, consumables.mob_atlas,
          consumables.short_painkiller, consumables.short_schizoyorsh, consumables.short_morphine, consumables.short_epinephrine,
          consumables.bonus_stomp, consumables.bonus_strike
        ]
      );
      res.json({ message: 'Consumables created successfully' });
    }
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating/inserting consumables:', err);
    res.status(500).json({ error: 'Failed to update/create consumables' });
  } finally {
    client.release();
  }
});

module.exports = router;
