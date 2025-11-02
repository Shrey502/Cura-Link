// routes/chat.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. Get or Create a Chat Room ---
router.post('/rooms', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ error: 'otherUserId is required' });
  }

  // Check if they are connected
  try {
    const connectionQuery = `
      SELECT * FROM connections
      WHERE 
        (requester_id = $1 AND recipient_id = $2 AND status = 'ACCEPTED') OR
        (requester_id = $2 AND recipient_id = $1 AND status = 'ACCEPTED');
    `;
    const connection = await db.query(connectionQuery, [userId, otherUserId]);
    if (connection.rows.length === 0) {
      return res.status(403).json({ error: 'You are not connected with this user.' });
    }
    
    // They are connected, so use their connection ID as the chat room ID
    const room = {
      id: connection.rows[0].id,
      name: 'Researcher Chat' // We can make this dynamic later
    };

    res.status(200).json(room);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error finding chat room' });
  }
});

// --- 2. Get Messages for a Room ---
router.get('/messages/:roomId', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { roomId } = req.params;

  try {
    // We need to verify the user is part of this connection
    const verifyQuery = `
      SELECT * FROM connections
      WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2) AND status = 'ACCEPTED'
    `;
    const verification = await db.query(verifyQuery, [roomId, userId]);
    if (verification.rows.length === 0) {
      return res.status(403).json({ error: "You do not have access to this chat room." });
    }

    // Get messages and sender's name
    const query = `
      SELECT m.*, rp.full_name AS sender_name
      FROM chat_messages m
      JOIN researcher_profiles rp ON m.sender_id = rp.user_id
      WHERE m.connection_id = $1
      ORDER BY m.created_at ASC;
    `;
    const messages = await db.query(query, [roomId]);
    res.status(200).json(messages.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// --- 3. Post a new Message ---
router.post('/messages', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { roomId, body } = req.body;

  if (!roomId || !body) {
    return res.status(400).json({ error: 'roomId and body are required' });
  }

  try {
    // Verify the user is part of this connection
    const verifyQuery = `
      SELECT * FROM connections
      WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2) AND status = 'ACCEPTED'
    `;
    const verification = await db.query(verifyQuery, [roomId, userId]);
    if (verification.rows.length === 0) {
      return res.status(403).json({ error: "You cannot post in this chat room." });
    }
    
    const query = `
      INSERT INTO chat_messages (connection_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const newMessage = await db.query(query, [roomId, userId, body]);
    res.status(201).json(newMessage.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// --- 4. NEW: Edit a Message ---
router.put('/messages/:messageId', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { messageId } = req.params;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ error: 'Message body is required' });
  }

  try {
    // Update the message ONLY if the sender_id matches the logged-in user
    const query = `
      UPDATE chat_messages
      SET body = $1, created_at = NOW() -- Show it as edited "now"
      WHERE id = $2 AND sender_id = $3
      RETURNING *;
    `;
    const updatedMessage = await db.query(query, [body, messageId, userId]);

    if (updatedMessage.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or you are not the sender.' });
    }
    
    // Return the updated message (it won't have sender_name, frontend will add "Me")
    res.status(200).json(updatedMessage.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error editing message' });
  }
});

// --- 5. NEW: Delete a Message ---
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { messageId } = req.params;

  try {
    // Delete the message ONLY if the sender_id matches the logged-in user
    const query = `
      DELETE FROM chat_messages
      WHERE id = $1 AND sender_id = $2
      RETURNING *;
    `;
    const deletedMessage = await db.query(query, [messageId, userId]);

    if (deletedMessage.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or you are not the sender.' });
    }

    res.status(200).json({ message: 'Message deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting message' });
  }
});


module.exports = router;

