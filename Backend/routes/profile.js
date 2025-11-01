// routes/profile.js
const express = require('express');
const db = require('../db/db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// --- Update Patient Profile ---
router.put('/patient', authenticateToken, async (req, res) => {
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
    const updatedProfile = await db.query(updateQuery, [
      fullName,
      location,
      JSON.stringify(conditions),
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

// --- Update Researcher Profile ---
router.put('/researcher', authenticateToken, async (req, res) => {
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
    const updatedProfile = await db.query(updateQuery, [
      fullName,
      JSON.stringify(specialties),
      JSON.stringify(researchInterests),
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

module.exports = router;