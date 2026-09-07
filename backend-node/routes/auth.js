// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// FR-09: Registration
router.post('/register', async (req, res) => {
  const { first_name, email, password, subscription_type } = req.body;

  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  const plan = subscription_type === 'Premium' ? 'Premium' : 'Free';

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, email, password_hash, subscription_type) VALUES (?, ?, ?, ?)',
      [first_name, email, password_hash, plan]
    );

    const token = jwt.sign({ user_id: result.insertId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { user_id: result.insertId, first_name, email, subscription_type: plan, role: 'user' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// FR-09: Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        email: user.email,
        subscription_type: user.subscription_type,
        subscription_status: user.subscription_status,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// FR-09: Logout — stateless JWT, so "logout" is just the client discarding
// the token. This endpoint exists for a consistent API shape and so the
// frontend has a single place to call regardless of backend implementation.
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Logged out.' });
});

// FR-10: Subscription/account management (high-level plan state only —
// no pricing or payment processing, as specified in the requirement).
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, first_name, last_name, email, subscription_type, subscription_status, role, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load account.' });
  }
});

router.patch('/me/subscription', requireAuth, async (req, res) => {
  const { subscription_type } = req.body;
  if (!['Free', 'Premium'].includes(subscription_type)) {
    return res.status(400).json({ error: 'subscription_type must be Free or Premium.' });
  }
  try {
    await pool.query('UPDATE users SET subscription_type = ? WHERE user_id = ?', [subscription_type, req.user.user_id]);
    res.json({ message: 'Plan updated.', subscription_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

module.exports = router;
