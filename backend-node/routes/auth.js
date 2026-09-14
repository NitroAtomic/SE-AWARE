// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const attempts = new Map();

function authRateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < 15 * 60_000);
  if (recent.length >= 20) return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' });
  recent.push(now);
  attempts.set(key, recent);
  next();
}

// FR-09: Registration
router.post('/register', authRateLimit, async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Password is too long.' });
  if (!EMAIL_RE.test(email) || String(first_name).trim().length < 2) return res.status(400).json({ error: 'Enter a valid name and email address.' });
  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, subscription_type) VALUES (?, ?, ?, ?, \'Free\')',
      [String(first_name).trim(), last_name ? String(last_name).trim() : null, normalizedEmail, password_hash]
    );

    const token = jwt.sign({ user_id: result.insertId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { user_id: result.insertId, first_name: String(first_name).trim(), last_name: last_name || '', email: normalizedEmail, subscription_type: 'Free', subscription_status: 'active', role: 'user' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// FR-09: Login
router.post('/login', authRateLimit, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!EMAIL_RE.test(email) || Buffer.byteLength(String(password), 'utf8') > 72) return res.status(401).json({ error: 'Incorrect email or password.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
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

// FR-10: change the plan directly, no payment involved.
//
// The paper's Scope and Limitations section excludes "online payment gateway
// integration, automatic billing, or financial transaction processing" from
// this study, and FR-10 itself covers account-level plan management only.
// This endpoint is therefore the documented way a user moves between Free and
// Premium: it records the plan on the account and nothing else. No money
// changes hands, and the interface says so plainly.
router.patch('/me/subscription', requireAuth, async (req, res) => {
  const { subscription_type } = req.body;
  if (!['Free', 'Premium'].includes(subscription_type)) {
    return res.status(400).json({ error: 'subscription_type must be Free or Premium.' });
  }
  try {
    await pool.query(
      'UPDATE users SET subscription_type = ?, subscription_status = ? WHERE user_id = ?',
      [subscription_type, 'active', req.user.user_id]
    );
    res.json({ message: 'Plan updated.', subscription_type, subscription_status: 'active' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

module.exports = router;
