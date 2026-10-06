// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

/* ---------------------------------------------------------------------------
   The session cookie
   ---------------------------------------------------------------------------
   The API is called by fetch(), which can attach an Authorization header. A
   plain page navigation cannot - typing a URL or clicking a link sends no
   header anywhere. That is precisely why the premium module pages could be
   read by anyone: the server had no way to tell who was asking for them.

   A cookie travels on navigation automatically, so the same login that issues
   the bearer token also drops one here. The header stays the credential for
   the API; the cookie exists so that a request for an HTML page can be judged
   at all.

   HttpOnly keeps it away from document.cookie, so a script injected into the
   page cannot read it. SameSite=Lax means it rides along with ordinary
   top-level navigation but not with cross-site form posts, which is what
   stops another website from acting as the signed-in user.
   --------------------------------------------------------------------------- */
const AUTH_COOKIE = 'se_session';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // matches the token's 7d life

function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out = {};
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch (err) {
      // A malformed cookie is not a reason to fail the request.
    }
  }
  return out;
}

function setAuthCookie(res, token) {
  const bits = [
    `${AUTH_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];
  // Secure would make the cookie invisible over plain http, which is how the
  // site runs locally. Render terminates TLS, so production always gets it.
  if (process.env.NODE_ENV === 'production') bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}

function clearAuthCookie(res) {
  const bits = [`${AUTH_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (process.env.NODE_ENV === 'production') bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}

// Header first, cookie second. Only the static-file guard needs the cookie;
// the API keeps taking its credential from the header, so adding the cookie
// changes nothing about how the existing endpoints authenticate.
function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return parseCookies(req)[AUTH_COOKIE] || null;
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

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth,
  JWT_SECRET,
  AUTH_COOKIE,
  readToken,
  setAuthCookie,
  clearAuthCookie,
};
