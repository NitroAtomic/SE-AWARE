// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

// Verifies the request has a valid token, attaches req.user = { user_id, role }
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    /* A pendingToken is NOT a login. It is issued after the password but
       before the one-time code, and it is signed with the same secret, so it
       verifies here perfectly well. Accepting it would let anyone read the
       pendingToken out of the login response and skip the code entirely,
       which would make the whole second step decorative. */
    if (payload.otp_pending) {
      return res.status(401).json({ error: 'Finish verifying your login first.' });
    }

    req.user = payload; // { user_id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Same as requireAuth, but also requires role === 'admin' (FR-17/18/19)
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  });
}

// Attaches req.user if a valid token is present, but doesn't block the
// request if there isn't one — used for endpoints that behave differently
// for logged-in vs anonymous visitors (e.g. Free vs Premium module content).
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      // Same rule as requireAuth: a half-finished login is not a login. On an
      // optional route that means anonymous, not Premium - otherwise the
      // pendingToken would unlock paid content without the code.
      if (!payload.otp_pending) req.user = payload;
    } catch (err) {
      // invalid token on an optional route: just treat as anonymous
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth, JWT_SECRET };
