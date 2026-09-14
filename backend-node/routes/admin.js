const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT user_id, first_name, last_name, email, subscription_type,
      subscription_status, role, created_at FROM users ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

router.patch('/users/:id', async (req, res) => {
  const { subscription_type, subscription_status } = req.body;
  if (!['Free', 'Premium'].includes(subscription_type) || !['active', 'cancelled', 'expired'].includes(subscription_status)) {
    return res.status(400).json({ error: 'Invalid subscription values.' });
  }
  try {
    await pool.query('UPDATE users SET subscription_type = ?, subscription_status = ? WHERE user_id = ?', [subscription_type, subscription_status, req.params.id]);
    res.json({ message: 'User updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  if (Number(req.params.id) === Number(req.user.user_id)) return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
  try {
    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT qq.question_id, qq.quiz_id, qq.question_text, qq.options,
      qq.correct_option_index, qq.order_index, m.module_title, m.slug
      FROM quiz_questions qq JOIN quizzes q ON q.quiz_id = qq.quiz_id
      JOIN modules m ON m.module_id = q.module_id ORDER BY m.module_title, qq.order_index`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load questions.' });
  }
});

router.get('/quizzes', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT q.quiz_id, q.title, m.module_title, m.slug
      FROM quizzes q JOIN modules m ON m.module_id = q.module_id ORDER BY m.module_title`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

module.exports = router;
