// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { randomInt } = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth, JWT_SECRET, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { sendOtpEmail } = require('../config/email');

const router = express.Router();
const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const attempts = new Map();

/* ----------------------------------------------------------------------
   One-time login codes
   ----------------------------------------------------------------------
   Premium accounts are asked for a six-digit code after their password.
   The code is generated with crypto.randomInt rather than Math.random, so
   it cannot be predicted from previous codes, and it is stored bcrypt-hashed
   like a password - reading the table does not let anyone sign in.

   Between the password and the code the person is NOT signed in. They hold a
   pendingToken, which proves only "this password was correct and a code was
   sent", expires with the code, and grants nothing on its own.
   ---------------------------------------------------------------------- */

function generateOtpCode() {
  return String(randomInt(0, 1000000)).padStart(6, '0');
}

async function issueOtp(user) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const connection = await pool.getConnection();
  let otpId;
  try {
    await connection.beginTransaction();
    // Retiring the previous code first means a second login attempt cannot
    // leave two valid codes alive at once.
    await connection.query(
      "UPDATE otpcode SET used = 1 WHERE user_id = ? AND purpose = 'login' AND used = 0",
      [user.user_id]
    );
    const [result] = await connection.query(
      "INSERT INTO otpcode (user_id, code_hash, purpose, expires_at) VALUES (?, ?, 'login', ?)",
      [user.user_id, codeHash, expiresAt]
    );
    otpId = result.insertId;
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const sent = await sendOtpEmail(user.email, code);
  return { otpId, mode: sent.mode };
}

function createPendingOtpToken(userId, otpId) {
  return jwt.sign(
    { user_id: userId, otp_pending: true, otp_id: otpId },
    JWT_SECRET,
    { expiresIn: `${OTP_TTL_MINUTES}m` }
  );
}

function signInToken(user) {
  return jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    user_id: user.user_id,
    first_name: user.first_name,
    email: user.email,
    subscription_type: user.subscription_type,
    subscription_status: user.subscription_status,
    role: user.role,
  };
}

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
    // Same token, second delivery route: see middleware/auth.js for why a
    // page request needs a cookie and a fetch() does not.
    setAuthCookie(res, token);
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

    /* Premium accounts get a second step. The password alone is not enough,
       which is the point: these are the accounts with something to protect.
       Free accounts sign in directly, so the common path stays one step.

       Note what is NOT returned here - no token, and no user object. Until
       the code is verified this person is not signed in. */
    if (user.subscription_type === 'Premium') {
      const sent = await issueOtp(user);

      // The code is stored and valid either way. 'console' means SMTP is not
      // set up and the code went to the server log, which is fine for a demo.
      // 'failed' means SMTP exists but the send broke, so say so rather than
      // leave someone waiting for an email that is not coming.
      if (sent.mode === 'failed') {
        return res.status(503).json({
          error: 'We could not send your verification code right now. Please try again in a moment.',
        });
      }

      return res.json({
        requiresOtp: true,
        pendingToken: createPendingOtpToken(user.user_id, sent.otpId),
        email: user.email,
        expiresInMinutes: OTP_TTL_MINUTES,
      });
    }

    const token = signInToken(user);
    setAuthCookie(res, token);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

/* Second half of a Premium login: trade the code for a real token. */
router.post('/verify-otp', authRateLimit, async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code) {
    return res.status(400).json({ error: 'pendingToken and code are required.' });
  }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'The verification code must be exactly 6 digits.' });
  }

  let payload;
  try {
    payload = jwt.verify(pendingToken, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'This verification session expired. Please log in again.' });
  }
  if (!payload.otp_pending || !payload.otp_id) {
    return res.status(400).json({ error: 'Invalid verification session.' });
  }

  try {
    const [otpRows] = await pool.query(
      "SELECT * FROM otpcode WHERE otp_id = ? AND user_id = ? AND purpose = 'login' AND used = 0",
      [payload.otp_id, payload.user_id]
    );
    if (otpRows.length === 0) {
      return res.status(400).json({ error: 'No pending code found. Please log in again.' });
    }
    const otp = otpRows[0];

    if (new Date(otp.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This code has expired. Please log in again to get a new one.' });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please log in again to get a new code.' });
    }

    const match = await bcrypt.compare(code, otp.code_hash);
    if (!match) {
      // Counting the attempt in the UPDATE itself, guarded on the limit,
      // means two requests racing cannot both slip past the cap.
      const [attemptResult] = await pool.query(
        'UPDATE otpcode SET attempts = attempts + 1 WHERE otp_id = ? AND used = 0 AND attempts < ?',
        [otp.otp_id, OTP_MAX_ATTEMPTS]
      );
      if (attemptResult.affectedRows === 0) {
        return res.status(429).json({ error: 'Too many incorrect attempts. Please log in again to get a new code.' });
      }
      return res.status(401).json({ error: 'Incorrect code. Please try again.' });
    }

    // Burn the code in a guarded UPDATE for the same reason: one use only,
    // even if the same code arrives twice at once.
    const [usedResult] = await pool.query(
      'UPDATE otpcode SET used = 1 WHERE otp_id = ? AND used = 0 AND attempts < ?',
      [otp.otp_id, OTP_MAX_ATTEMPTS]
    );
    if (usedResult.affectedRows === 0) {
      return res.status(400).json({ error: 'This verification code is no longer active. Please request a new one.' });
    }

    const [userRows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [payload.user_id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Account not found.' });
    const user = userRows[0];

    const token = signInToken(user);
    // Only now, after the code was accepted. The pending token never gets a
    // cookie, so a half-finished login cannot reach the paid pages either.
    setAuthCookie(res, token);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

/* A fresh code, for when the first did not arrive. Issuing a new one retires
   the old, and the caller gets a new pendingToken pointing at it. */
router.post('/resend-otp', authRateLimit, async (req, res) => {
  const { pendingToken } = req.body;
  if (!pendingToken) return res.status(400).json({ error: 'pendingToken is required.' });

  let payload;
  try {
    payload = jwt.verify(pendingToken, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'This verification session expired. Please log in again.' });
  }
  if (!payload.otp_pending) return res.status(400).json({ error: 'Invalid verification session.' });

  try {
    const [userRows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [payload.user_id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Account not found.' });

    const sent = await issueOtp(userRows[0]);
    if (sent.mode === 'failed') {
      return res.status(503).json({
        error: 'We could not send your verification code right now. Please try again in a moment.',
      });
    }

    res.json({
      message: 'A new code has been sent.',
      pendingToken: createPendingOtpToken(payload.user_id, sent.otpId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not resend the code.' });
  }
});

// FR-09: Logout — stateless JWT, so "logout" is just the client discarding
// the token. This endpoint exists for a consistent API shape and so the
// frontend has a single place to call regardless of backend implementation.
router.post('/logout', requireAuth, (req, res) => {
  clearAuthCookie(res);
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
