// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();

const JWT_SECRET = 'your-super-secret-key-for-the-hackathon';

// --- User Registration ---
router.post('/register', async (req, res) => {
  const { email, password, role, fullName } = req.body;
  if (!email || !password || !role || !fullName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (role !== 'PATIENT' && role !== 'RESEARCHER') {
    return res.status(400).json({ error: 'Role must be PATIENT or RESEARCHER' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await db.query('BEGIN');
    const userQuery = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id; 
    `;
    const newUser = await db.query(userQuery, [email, passwordHash, role]);
    const newUserId = newUser.rows[0].id;
    if (role === 'PATIENT') {
      await db.query('INSERT INTO patient_profiles (user_id, full_name) VALUES ($1, $2);', [newUserId, fullName]);
    } else if (role === 'RESEARCHER') {
      await db.query('INSERT INTO researcher_profiles (user_id, full_name) VALUES ($1, $2);', [newUserId, fullName]);
    }
    await db.query('COMMIT');
    res.status(201).json({
      message: 'User registered successfully!',
      userId: newUserId,
      role: role
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// --- User Login ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }
  try {
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await db.query(userQuery, [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;