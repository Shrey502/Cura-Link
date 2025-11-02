// routes/forums.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- 1. Get All Forum Categories ---
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM forum_communities ORDER BY name';
    const categories = await db.query(query);
    res.status(200).json(categories.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// --- 2. Create a New Category (Researchers Only) ---
router.post('/categories', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { name, description } = req.body;

  if (role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Forbidden: Only researchers can create categories' });
  }
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }

  try {
    const query = `
      INSERT INTO forum_communities (name, description, created_by_researcher_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const newCategory = await db.query(query, [name, description, userId]);
    res.status(201).json(newCategory.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- 3. Get All Posts (Questions) in a Category ---
router.get('/posts/:categoryId', authenticateToken, async (req, res) => {
  const { categoryId } = req.params;
  try {
    // UPDATED QUERY: Join patient_profiles to get the full_name
    const query = `
      SELECT p.*, pp.full_name 
      FROM forum_posts p
      JOIN patient_profiles pp ON p.author_id = pp.user_id
      WHERE p.community_id = $1 
      ORDER BY p.created_at DESC;
    `;
    const posts = await db.query(query, [categoryId]);
    res.status(200).json(posts.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching posts' });
  }
});

// --- 4. Create a New Post (Question) (Patients Only) ---
router.post('/posts', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { title, body, communityId } = req.body;

  if (role !== 'PATIENT') {
    return res.status(403).json({ error: 'Forbidden: Only patients can create posts' });
  }
  if (!title || !body || !communityId) {
    return res.status(400).json({ error: 'Title, body, and communityId are required' });
  }

  try {
    const query = `
      INSERT INTO forum_posts (community_id, author_id, title, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const newPost = await db.query(query, [communityId, userId, title, body]);
    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- 5. Get All Replies (Answers) for a Post ---
router.get('/replies/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  try {
    // UPDATED QUERY: Join researcher_profiles to get the full_name
    const query = `
      SELECT r.*, rp.full_name
      FROM forum_replies r
      JOIN researcher_profiles rp ON r.author_id = rp.user_id
      WHERE r.post_id = $1 
      ORDER BY r.created_at ASC;
    `;
    const replies = await db.query(query, [postId]);
    res.status(200).json(replies.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching replies' });
  }
});

// --- 6. Create a New Reply (Answer) (Researchers Only) ---
router.post('/replies', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { body, postId } = req.body;

  if (role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Forbidden: Only researchers can reply' }); // Typo was here
  }
  if (!body || !postId) {
    return res.status(400).json({ error: 'Body and postId are required' });
  }

  try {
    const query = `
      INSERT INTO forum_replies (post_id, author_id, body)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const newReply = await db.query(query, [postId, userId, body]);
    res.status(201).json(newReply.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;