// routes/favorites.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. Add a new Favorite ---
router.post('/', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { itemId, itemType } = req.body; // e.g., "NCT12345", "TRIAL"

  if (!itemId || !itemType) {
    return res.status(400).json({ error: 'itemId and itemType are required' });
  }
  if (!['TRIAL', 'PUBLICATION', 'EXPERT'].includes(itemType)) {
    return res.status(400).json({ error: 'Invalid itemType' });
  }

  try {
    const query = `
      INSERT INTO favorites (user_id, favorited_item_id, item_type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const newFavorite = await db.query(query, [userId, itemId, itemType]);

    res.status(201).json(newFavorite.rows[0]);

  } catch (err) {
    if (err.code === '23505') { // "unique constraint"
      return res.status(409).json({ error: 'Item already favorited' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- 2. Get all of a user's Favorites ---
// routes/favorites.js

// --- 2. Get all of a user's Favorites (FIXED) ---
router.get('/', authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const query = `
      SELECT 
        f.item_type,
        f.favorited_item_id,
        COALESCE(p.title, t.title, rp.full_name) AS title,
        COALESCE(p.ai_summary, t.ai_summary) AS summary
      FROM 
        favorites f
      LEFT JOIN 
        publications p ON f.item_type = 'PUBLICATION' AND f.favorited_item_id = p.id
      LEFT JOIN 
        clinical_trials t ON f.item_type = 'TRIAL' AND f.favorited_item_id = t.id
      LEFT JOIN 
        researcher_profiles rp ON f.item_type = 'EXPERT' AND f.favorited_item_id = rp.user_id::text
      WHERE 
        f.user_id = $1;
    `;
    const favorites = await db.query(query, [userId]);
    res.status(200).json(favorites.rows);
  
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching favorites' });
  }
});

// ... (keep your POST and DELETE routes) ...

// --- 3. Remove a Favorite ---
router.delete('/', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { itemId, itemType } = req.body; // e.g., "NCT12345", "TRIAL"

    if (!itemId || !itemType) {
        return res.status(400).json({ error: 'itemId and itemType are required' });
    }

    try {
        const query = `
            DELETE FROM favorites
            WHERE user_id = $1 AND favorited_item_id = $2 AND item_type = $3
            RETURNING *;
        `;
        const deleted = await db.query(query, [userId, itemId, itemType]);

        if (deleted.rows.length === 0) {
            return res.status(404).json({ error: 'Favorite not found' });
        }

        res.status(200).json({ message: 'Favorite removed' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;