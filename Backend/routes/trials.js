// routes/trials.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. Get all trials created by the logged-in researcher ---
router.get('/', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;

  if (role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const query = 'SELECT * FROM clinical_trials WHERE researcher_id = $1 ORDER BY id DESC';
    const myTrials = await db.query(query, [userId]);
    res.status(200).json(myTrials.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching trials' });
  }
});

// --- 2. Create a new clinical trial ---
router.post('/', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { id, title, description, ai_summary, status, location } = req.body;

  if (role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!id || !title || !description || !status) {
    return res.status(400).json({ error: 'ID, title, description, and status are required' });
  }

  try {
    const query = `
      INSERT INTO clinical_trials 
        (id, title, description, ai_summary, status, location, researcher_id, trial_url)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    // We'll use the official URL since this is a real trial ID (e.g., NCT...)
    const trial_url = `https://clinicaltrials.gov/study/${id}`;
    
    // Use a placeholder AI summary for researcher-added trials
    const final_ai_summary = ai_summary || "This summary was provided by the researcher.";

    const newTrial = await db.query(query, [
      id, title, description, final_ai_summary, status, location, userId, trial_url
    ]);

    res.status(201).json(newTrial.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint (ID already exists)
      return res.status(409).json({ error: 'A trial with this ID already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error creating trial' });
  }
});

module.exports = router;