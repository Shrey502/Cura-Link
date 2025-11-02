// routes/connections.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. Send a new connection request ---
router.post('/request', authenticateToken, async (req, res) => {
  const { userId } = req.user; // Requester
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ error: 'recipientId is required' });
  }

  try {
    const query = `
      INSERT INTO connections (requester_id, recipient_id, status)
      VALUES ($1, $2, 'PENDING')
      RETURNING *;
    `;
    const newRequest = await db.query(query, [userId, recipientId]);
    res.status(201).json(newRequest.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint
      return res.status(409).json({ error: 'Request already sent' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error sending request' });
  }
});

// --- 2. Get all PENDING requests for the logged-in user ---
router.get('/pending', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    // Find all PENDING requests where I am the recipient
    // AND get the requester's name
    const query = `
      SELECT c.id, c.requester_id, rp.full_name AS requester_name
      FROM connections c
      JOIN researcher_profiles rp ON c.requester_id = rp.user_id
      WHERE c.recipient_id = $1 AND c.status = 'PENDING'
      ORDER BY c.created_at DESC;
    `;
    const requests = await db.query(query, [userId]);
    res.status(200).json(requests.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching pending requests' });
  }
});

// --- 3. Respond to a request (Accept or Reject) ---
router.put('/respond', authenticateToken, async (req, res) => {
  const { userId } = req.user; // Recipient
  const { requestId, response } = req.body; // response is 'ACCEPTED' or 'REJECTED'

  if (!requestId || !response) {
    return res.status(400).json({ error: 'requestId and response are required' });
  }
  if (response !== 'ACCEPTED' && response !== 'REJECTED') {
    return res.status(400).json({ error: 'Invalid response' });
  }

  try {
    // Update the request, but ONLY if I am the recipient
    const query = `
      UPDATE connections
      SET status = $1
      WHERE id = $2 AND recipient_id = $3
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

// --- 4. Get all ACCEPTED connections (my collaborators) ---
router.get('/accepted', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    // Find all ACCEPTED connections where I am either user
    // AND get the other person's name and ID
    const query = `
      SELECT 
        c.id AS connection_id,
        CASE
          WHEN c.requester_id = $1 THEN c.recipient_id
          ELSE c.requester_id
        END AS collaborator_id,
        rp.full_name AS collaborator_name
      FROM connections c
      JOIN researcher_profiles rp ON 
        rp.user_id = CASE
          WHEN c.requester_id = $1 THEN c.recipient_id
          ELSE c.requester_id
        END
      WHERE (c.requester_id = $1 OR c.recipient_id = $1)
      AND c.status = 'ACCEPTED';
    `;
    const collaborators = await db.query(query, [userId]);
    res.status(200).json(collaborators.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching collaborators' });
  }
});

module.exports = router;

