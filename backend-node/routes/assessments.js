// routes/assessments.js
//
// The real SE-AWARE frontend (assessment-data.js) has its own fixed
// 15-question bank and already scores client-side, consistent with how
// quiz.js also scores client-side in this codebase. This route persists
// whatever the client computed rather than re-scoring against a different
// question set server-side.

const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// FR-11: Save an assessment result (already scored client-side)
router.post('/submit', requireAuth, async (req, res) => {
  const { score, total, level, level_key, by_topic, weak_areas } = req.body;

  if (typeof score !== 'number' || typeof total !== 'number' || !level || !by_topic || !weak_areas) {
    return res.status(400).json({ error: 'score, total, level, level_key, by_topic, and weak_areas are required.' });
  }

  try {
    await pool.query(
      'INSERT INTO assessments (user_id, score, total, awareness_level, level_key, by_topic, weak_areas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.user_id, score, total, level, level_key || level.toLowerCase(), JSON.stringify(by_topic), JSON.stringify(weak_areas)]
    );
    res.json({ message: 'Assessment saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save assessment.' });
  }
});

// Fetch the most recent assessment for the logged-in user
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT score, total, awareness_level, level_key, by_topic, weak_areas, assessment_date FROM assessments WHERE user_id = ? ORDER BY assessment_date DESC LIMIT 1',
      [req.user.user_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load assessment.' });
  }
});

module.exports = router;
