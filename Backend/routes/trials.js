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

    // --- 2. Create a new clinical trial (UPDATED) ---
    router.post('/', authenticateToken, async (req, res) => {
    const { userId, role } = req.user;
    // Added contact_email
    const { id, title, description, ai_summary, status, location, contact_email } = req.body; 

    if (role !== 'RESEARCHER') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!id || !title || !description || !status) {
        return res.status(400).json({ error: 'ID, title, description, and status are required' });
    }

    try {
        const query = `
        INSERT INTO clinical_trials 
            (id, title, description, ai_summary, status, location, researcher_id, trial_url, contact_email)
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
        `;
        
        const trial_url = `https://clinicaltrials.gov/study/${id}`;
        const final_ai_summary = ai_summary || "This summary was provided by the researcher.";

        const newTrial = await db.query(query, [
        id, title, description, final_ai_summary, status, location, userId, trial_url, 
        contact_email || 'N/A' // Use N/A if email is blank
        ]);

        res.status(201).json(newTrial.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
        return res.status(409).json({ error: 'A trial with this ID already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error creating trial' });
    }
    });

    // --- 3. NEW: Update a clinical trial ---
    router.put('/:trialId', authenticateToken, async (req, res) => {
    const { userId, role } = req.user;
    const { trialId } = req.params;
    const { title, description, status, location, contact_email } = req.body;

    if (role !== 'RESEARCHER') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const query = `
        UPDATE clinical_trials
        SET 
            title = $1,
            description = $2,
            status = $3,
            location = $4,
            contact_email = $5
        WHERE 
            id = $6 AND researcher_id = $7
        RETURNING *;
        `;
        const updatedTrial = await db.query(query, [
        title, description, status, location, contact_email, trialId, userId
        ]);

        if (updatedTrial.rows.length === 0) {
        return res.status(404).json({ error: 'Trial not found or you do not have permission to edit it.' });
        }
        res.status(200).json(updatedTrial.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating trial' });
    }
    });

    // --- 4. NEW: Delete a clinical trial ---
    router.delete('/:trialId', authenticateToken, async (req, res) => {
    const { userId, role } = req.user;
    const { trialId } = req.params;

    if (role !== 'RESEARCHER') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const query = `
        DELETE FROM clinical_trials
        WHERE id = $1 AND researcher_id = $2
        RETURNING *;
        `;
        const deletedTrial = await db.query(query, [trialId, userId]);

        if (deletedTrial.rows.length === 0) {
        return res.status(404).json({ error: 'Trial not found or you do not have permission to delete it.' });
        }
        res.status(200).json({ message: 'Trial deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting trial' });
    }
    });

    module.exports = router;

