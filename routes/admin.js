const express = require('express');
const pool = require('../database/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

// ============================================
// GET ALL USERS WITH COMPLETE DATA
// ============================================

router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    console.log('Admin requesting all users data...');
    
    const result = await pool.query(`
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
        c.bonus_strike,
        cw.registered as clan_war_registered
      FROM users u
      LEFT JOIN player_stats p ON u.id = p.user_id
      LEFT JOIN equipment e ON u.id = e.user_id
      LEFT JOIN consumables c ON u.id = c.user_id
      LEFT JOIN clan_war_registration cw ON u.id = cw.user_id 
        AND cw.registration_date = CURRENT_DATE
      ORDER BY u.id ASC
    `);

    console.log(`✓ Returning ${result.rows.length} users with complete data`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================
// DELETE USER
// ============================================

router.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// UPDATE USER ROLE (NEW)
// ============================================

router.put('/users/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING username, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✓ Role updated: ${result.rows[0].username} → ${role}`);
    res.json({ message: 'Role updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ============================================
// GET PLAYER STATS
// ============================================

router.get('/stats/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM player_stats WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// UPDATE PLAYER STATS
// ============================================

router.put('/stats/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { ingame_name, discord_name, kills, deaths } = req.body;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const check = await pool.query('SELECT id FROM player_stats WHERE user_id = $1', [userId]);

    if (check.rows.length > 0) {
      await pool.query(
        `UPDATE player_stats 
         SET ingame_name = $1, discord_name = $2, kills = $3, deaths = $4
         WHERE user_id = $5`,
        [ingame_name, discord_name, kills, deaths, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO player_stats (user_id, ingame_name, discord_name, kills, deaths)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, ingame_name, discord_name, kills, deaths]
      );
    }

    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// ============================================
// GET EQUIPMENT
// ============================================

router.get('/equipment/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM equipment WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// ============================================
// UPDATE EQUIPMENT
// ============================================

router.put('/equipment/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { weapons, armors, artifact_builds, artifact_image } = req.body;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const check = await pool.query('SELECT id FROM equipment WHERE user_id = $1', [userId]);

    if (check.rows.length > 0) {
      await pool.query(
        `UPDATE equipment 
         SET weapons = $1, armors = $2, artifact_builds = $3, artifact_image = $4
         WHERE user_id = $5`,
        [weapons, armors, artifact_builds, artifact_image || null, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO equipment (user_id, weapons, armors, artifact_builds, artifact_image)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, weapons, armors, artifact_builds, artifact_image || null]
      );
    }

    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// ============================================
// GET CONSUMABLES
// ============================================

router.get('/consumables/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM consumables WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching consumables:', error);
    res.status(500).json({ error: 'Failed to fetch consumables' });
  }
});

// ============================================
// UPDATE CONSUMABLES
// ============================================

router.put('/consumables/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const consumables = req.body;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const check = await pool.query('SELECT id FROM consumables WHERE user_id = $1', [userId]);

    if (check.rows.length > 0) {
      await pool.query(
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
    } else {
      await pool.query(
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
    }

    res.json({ message: 'Consumables updated successfully' });
  } catch (error) {
    console.error('Error updating consumables:', error);
    res.status(500).json({ error: 'Failed to update consumables' });
  }
});

// ============================================
// CLAN WAR REGISTRATION (NEW)
// ============================================

router.get('/clan-war/status/:userId', verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await pool.query(
      `SELECT registered FROM clan_war_registration 
       WHERE user_id = $1 AND registration_date = CURRENT_DATE`,
      [userId]
    );

    res.json({ 
      registered: result.rows.length > 0 ? result.rows[0].registered : false 
    });
  } catch (error) {
    console.error('Error fetching clan war status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

router.post('/clan-war/register', verifyToken, async (req, res) => {
  try {
    const { registered } = req.body;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO clan_war_registration (user_id, registered, registration_date)
       VALUES ($1, $2, CURRENT_DATE)
       ON CONFLICT (user_id, registration_date)
       DO UPDATE SET registered = $2, registered_at = CURRENT_TIMESTAMP`,
      [userId, registered]
    );

    console.log(`✓ Clan war registration: ${req.user.username} → ${registered ? 'YES' : 'NO'}`);
    res.json({ message: 'Registration updated successfully' });
  } catch (error) {
    console.error('Error updating clan war registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

router.get('/clan-war/registrations', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        p.ingame_name,
        cw.registered,
        cw.registered_at
      FROM clan_war_registration cw
      JOIN users u ON cw.user_id = u.id
      LEFT JOIN player_stats p ON u.id = p.user_id
      WHERE cw.registration_date = CURRENT_DATE
      ORDER BY cw.registered_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ============================================
// CLAN STRATS (NEW)
// ============================================

router.get('/clan-strats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cs.id,
        cs.image_data,
        cs.title,
        cs.description,
        cs.uploaded_at,
        u.username as uploaded_by
      FROM clan_strats cs
      JOIN users u ON cs.uploaded_by = u.id
      ORDER BY cs.uploaded_at DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clan strats:', error);
    res.status(500).json({ error: 'Failed to fetch clan strats' });
  }
});

router.post('/clan-strats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { image_data, title, description } = req.body;

    const result = await pool.query(
      `INSERT INTO clan_strats (uploaded_by, image_data, title, description)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.user.id, image_data, title, description]
    );

    console.log(`✓ Clan strat uploaded by: ${req.user.username}`);
    res.json({ message: 'Strat uploaded successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error uploading clan strat:', error);
    res.status(500).json({ error: 'Failed to upload strat' });
  }
});

router.delete('/clan-strats/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const stratId = req.params.id;

    await pool.query('DELETE FROM clan_strats WHERE id = $1', [stratId]);

    res.json({ message: 'Strat deleted successfully' });
  } catch (error) {
    console.error('Error deleting strat:', error);
    res.status(500).json({ error: 'Failed to delete strat' });
  }
});

module.exports = router;