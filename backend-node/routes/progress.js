const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.put('/:slug', async (req, res) => {
  try {
    const [modules] = await pool.query('SELECT module_id, module_type FROM modules WHERE slug = ?', [req.params.slug]);
    if (!modules.length) return res.status(404).json({ error: 'Module not found.' });
    if (modules[0].module_type === 'Premium' && req.user.role !== 'admin') {
      const [users] = await pool.query('SELECT subscription_type, subscription_status FROM users WHERE user_id = ?', [req.user.user_id]);
      if (users[0]?.subscription_type !== 'Premium' || users[0]?.subscription_status !== 'active') {
        return res.status(403).json({ error: 'This module requires an active Premium subscription.' });
      }
    }
    await pool.query(`INSERT INTO progress (user_id, module_id, completion_status, completion_date)
      VALUES (?, ?, 'completed', NOW())
      ON DUPLICATE KEY UPDATE completion_status = 'completed', completion_date = NOW()`, [req.user.user_id, modules[0].module_id]);
    res.json({ status: 'completed', completed_at: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

router.delete('/:slug', async (req, res) => {
  try {
    await pool.query(`DELETE p FROM progress p JOIN modules m ON m.module_id = p.module_id
      WHERE p.user_id = ? AND m.slug = ?`, [req.user.user_id, req.params.slug]);
    res.json({ message: 'Progress removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

module.exports = router;
