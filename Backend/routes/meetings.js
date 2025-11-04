// routes/meetings.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. (PATIENT) Send a new meeting request ---
router.post('/request', authenticateToken, async (req, res) => {
  const { userId } = req.user; // This is the patient_id
  const { researcherId } = req.body;

  if (!researcherId) {
    return res.status(400).json({ error: 'researcherId is required' });
  }

  try {
    const query = `
      INSERT INTO meeting_requests (patient_id, researcher_id, status)
      VALUES ($1, $2, 'PENDING')
      RETURNING *;
    `;
    const newRequest = await db.query(query, [userId, researcherId]);
    res.status(201).json(newRequest.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint
      return res.status(409).json({ error: 'Request already sent' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error sending request' });
  }
});

// --- 2. (RESEARCHER) Get all PENDING meeting requests ---
router.get('/pending', authenticateToken, async (req, res) => {
  const { userId } = req.user; // This is the researcher_id
  try {
    const query = `
      SELECT mr.id, mr.patient_id, pp.full_name AS patient_name
      FROM meeting_requests mr
      JOIN patient_profiles pp ON mr.patient_id = pp.user_id
      WHERE mr.researcher_id = $1 AND mr.status = 'PENDING'
      ORDER BY mr.created_at DESC;
    `;
    const requests = await db.query(query, [userId]);
    res.status(200).json(requests.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching pending requests' });
  }
});

// --- 3. (RESEARCHER) Respond to a meeting request ---
router.put('/respond', authenticateToken, async (req, res) => {
  const { userId } = req.user; // This is the researcher_id
  const { requestId, response } = req.body; // response is 'ACCEPTED' or 'REJECTED'

  if (!requestId || !response || !['ACCEPTED', 'REJECTED'].includes(response)) {
    return res.status(400).json({ error: 'Valid requestId and response are required' });
  }

  try {
    const query = `
      UPDATE meeting_requests
      SET status = $1
      WHERE id = $2 AND researcher_id = $3
      RETURNING *;
    `;
    const updatedRequest = await db.query(query, [response, requestId, userId]);
    
    if (updatedRequest.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or you are not authorized' });
    }
    res.status(200).json(updatedRequest.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error responding to request' });
  }
});

// --- 4. (PATIENT) Get all ACCEPTED meeting requests ---
router.get('/updates', authenticateToken, async (req, res) => {
  const { userId } = req.user; // This is the patient_id
  try {
    const query = `
      SELECT 
        mr.id, 
        rp.full_name AS researcher_name, 
        u.email AS researcher_email,
        pp.conditions, 
      FROM meeting_requests mr
      JOIN researcher_profiles rp ON mr.researcher_id = rp.user_id
      JOIN users u ON mr.researcher_id = u.id
      WHERE mr.patient_id = $1 AND mr.status = 'ACCEPTED';
    `;
    const updates = await db.query(query, [userId]);
    res.status(200).json(updates.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching updates' });
  }
});

module.exports = router;
        
