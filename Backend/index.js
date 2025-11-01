// index.js
require('dotenv').config(); // Loads .env variables
const express = require('express');
const cors = require('cors');
const db = require('./db/db'); // Import our db setup

// --- 1. Create App & Middleware ---
const app = express();
app.use(cors());
app.use(express.json());

// --- 2. Import Routes ---
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const searchRoutes = require('./routes/search');
const favoritesRoutes = require('./routes/favorites');
const forumRoutes = require('./routes/forums');

// --- 3. Use Routes ---
// Note: We changed the URLs to be simpler!
app.use('/api', authRoutes); // e.g., /api/register
app.use('/api/profile', profileRoutes); // e.g., /api/profile/patient
app.use('/api/search', searchRoutes); // e.g., /api/search/publications
app.use('/api/favorites', favoritesRoutes); // e.g., /api/favorites
app.use('/api/forums', forumRoutes); // e.g., /api/forums

// --- 4. Simple Test Route ---
app.get('/api/test-db', async (req, res) => {
  try {
    const time = await db.query('SELECT NOW()');
    res.json({
      message: 'API is running!',
      db_time: time.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- 5. Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});