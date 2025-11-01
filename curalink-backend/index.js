// index.js

require('dotenv').config(); // Loads .env variables
console.log('Connecting to DB with URL:', process.env.DATABASE_URL); // Debug line
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL client
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // For PubMed and Hugging Face
const { XMLParser } = require("fast-xml-parser"); // For PubMed

// --- 1. Create App & Middleware ---
const app = express();
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Allow API to read JSON bodies

// --- 2. Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/cloud connections
  }
});

// --- 3. Simple Test Route ---
app.get('/api/test-db', async (req, res) => {
  try {
    const time = await pool.query('SELECT NOW()');
    res.json({
      message: 'API is running!',
      db_time: time.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- 4. Auth Constants & Middleware ---
const JWT_SECRET = 'your-super-secret-key-for-the-hackathon'; // Keep this simple for the hackathon

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = userPayload;
    next();
  });
};

// --- 5. User Registration Endpoint ---
app.post('/api/register', async (req, res) => {
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

    await pool.query('BEGIN');

    const userQuery = `
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id; 
    `;
    const newUser = await pool.query(userQuery, [email, passwordHash, role]);
    const newUserId = newUser.rows[0].id;

    if (role === 'PATIENT') {
      const profileQuery = `
        INSERT INTO patient_profiles (user_id, full_name)
        VALUES ($1, $2);
      `;
      await pool.query(profileQuery, [newUserId, fullName]);
    } else if (role === 'RESEARCHER') {
      const profileQuery = `
        INSERT INTO researcher_profiles (user_id, full_name)
        VALUES ($1, $2);
      `;
      await pool.query(profileQuery, [newUserId, fullName]);
    }

    await pool.query('COMMIT');

    res.status(201).json({
      message: 'User registered successfully!',
      userId: newUserId,
      role: role
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// --- 6. User Login Endpoint ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// --- 7. Update Patient Profile Endpoint (Protected) ---
app.put('/api/profile/patient', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { fullName, location, conditions } = req.body;

  if (role !== 'PATIENT') {
    return res.status(403).json({ error: 'Forbidden: Only patients can update' });
  }

  try {
    const updateQuery = `
      UPDATE patient_profiles
      SET full_name = $1, location = $2, conditions = $3
      WHERE user_id = $4
      RETURNING *; 
    `;
    const updatedProfile = await pool.query(updateQuery, [
      fullName,
      location,
      JSON.stringify(conditions), // JSON.stringify() fix
      userId
    ]);

    res.status(200).json({
      message: 'Patient profile updated successfully!',
      profile: updatedProfile.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// --- 8. Update Researcher Profile Endpoint (Protected) ---
app.put('/api/profile/researcher', authenticateToken, async (req, res) => {
  const { userId, role } = req.user;
  const { fullName, specialties, researchInterests, orcidLink, researchgateLink, isAvailableForMeetings } = req.body;

  if (role !== 'RESEARCHER') {
    return res.status(403).json({ error: 'Forbidden: Only researchers can update' });
  }

  try {
    const updateQuery = `
      UPDATE researcher_profiles
      SET 
        full_name = $1, specialties = $2, research_interests = $3,
        orcid_link = $4, researchgate_link = $5, is_available_for_meetings = $6
      WHERE user_id = $7
      RETURNING *; 
    `;
    const updatedProfile = await pool.query(updateQuery, [
      fullName,
      JSON.stringify(specialties), // JSON.stringify() fix
      JSON.stringify(researchInterests), // JSON.stringify() fix
      orcidLink,
      researchgateLink,
      isAvailableForMeetings,
      userId
    ]);

    res.status(200).json({
      message: 'Researcher profile updated successfully!',
      profile: updatedProfile.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// --- 9. Search Publications Endpoint (FIXED with Hugging Face) ---
app.post('/api/search/publications', authenticateToken, async (req, res) => {
  const { searchTerm } = req.body;
  if (!searchTerm) {
    return res.status(400).json({ error: 'searchTerm is required' });
  }

  const pubmedSearchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  const pubmedFetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

  try {
    // --- 1. Search PubMed for IDs ---
    console.log(`Searching PubMed for: ${searchTerm}`);
    const searchResponse = await axios.get(pubmedSearchUrl, {
      params: { db: 'pubmed', term: searchTerm, retmode: 'json', retmax: 5 }
    });

    const paperIds = searchResponse.data.esearchresult.idlist;
    if (!paperIds || paperIds.length === 0) {
      return res.status(404).json({ message: 'No publications found.' });
    }

    // --- 2. Fetch details for IDs ---
    console.log(`Fetching details for IDs: ${paperIds.join(',')}`);
    const fetchResponse = await axios.get(pubmedFetchUrl, {
      params: { db: 'pubmed', id: paperIds.join(','), retmode: 'xml' }
    });

    // --- 3. Parse XML (with fixed config) ---
    const parser = new XMLParser({
      ignoreAttributes: true,
      textNodeName: "#text"
    });
    let articles = parser.parse(fetchResponse.data).PubmedArticleSet.PubmedArticle;
    if (articles && !Array.isArray(articles)) {
      articles = [articles];
    }
    if (!articles) {
      return res.status(404).json({ message: 'Could not parse articles.' });
    }

    let publications = [];

    for (const article of articles) {
      if (!article || !article.MedlineCitation) continue;

      const pubmedData = article.MedlineCitation;
      const articleData = pubmedData.Article;

      // --- 4. Flatten Title and Abstract (FIX) ---
      const title = (articleData.ArticleTitle && typeof articleData.ArticleTitle === 'object')
        ? articleData.ArticleTitle["#text"]
        : articleData.ArticleTitle;

      let abstractText = "";
      const abstractData = articleData.Abstract?.AbstractText;
      if (Array.isArray(abstractData)) {
        abstractText = abstractData.map(part =>
          (part && typeof part === 'object' && part["#text"]) ? part["#text"] : (part || "")
        ).join(' ');
      } else if (abstractData && typeof abstractData === 'object' && abstractData["#text"]) {
        abstractText = abstractData["#text"];
      } else if (typeof abstractData === 'string') {
        abstractText = abstractData;
      }

      if (!abstractText) continue;

      // --- 5. AI Summarization (with Hugging Face) ---
      console.log(`Summarizing abstract for PMID: ${pubmedData.PMID}`);
      const prompt = `Summarize the following medical abstract for a patient, focusing on the key findings: "${abstractText}"`;

      const hfUrl = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
      let aiSummary = "Summary not available."; // Default

      try {
        const aiResponse = await axios.post(
          hfUrl,
          { "inputs": abstractText }, // Use the full abstract
          {
            headers: {
              'Authorization': `Bearer ${process.env.HF_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiSummary = aiResponse.data[0].summary_text;
      } catch (aiError) {
        console.error(`AI summarization failed for PMID ${pubmedData.PMID}:`, aiError.message);
        if (aiError.response) {
          console.error(aiError.response.data); // Log the detailed error
        }
      }

      // --- 6. Format and Save Data ---
      const year = articleData.Journal?.JournalIssue?.PubDate?.Year || '1970';
      const published_at = `${year}-01-01`;

      const pub = {
        id: pubmedData.PMID,
        title: title,
        abstract: abstractText,
        ai_summary: aiSummary,
        publication_url: `https://pubmed.ncbi.nlm.nih.gov/${pubmedData.PMID}/`,
        published_at: published_at
      };

      publications.push(pub);

      // --- 7. Save to Database ---
      try {
        const saveQuery = `
          INSERT INTO publications (id, title, abstract, ai_summary, publication_url, published_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING;
        `;
        await pool.query(saveQuery, [pub.id, pub.title, pub.abstract, pub.ai_summary, pub.publication_url, pub.published_at]);
      } catch (dbError) {
        console.error(`Database save failed for PMID ${pub.id}:`, dbError.message);
      }
    }

    res.status(200).json(publications);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching publications' });
  }
});

// --- 10. Start Server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});