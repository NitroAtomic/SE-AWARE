/* ==========================================================================
   premium-gate.js: refuses paid content to accounts that have not paid for it
   --------------------------------------------------------------------------
   Before this existed, the premium gate lived entirely in the browser.
   account.js would wait for the page to load and then overwrite it:

       gate.innerHTML = lockCard(...)

   The lesson had already been delivered by then. All 1,500-odd words of
   modules/invoice-scams.html arrived in the response, and the script simply
   painted over them. Viewing source, turning JavaScript off, or opening the
   URL with anything that is not a browser showed the whole thing. The same
   went for js/quiz-data-premium.js, which is 42 KB of questions and answers
   sitting at a predictable address.

   This middleware runs BEFORE express.static, so a request for paid content
   is judged before any file is read off disk. The browser-side gate stays
   where it is - it still gives instant feedback and a tidier page - but it is
   no longer the only thing standing there.

   Admins pass through: the management panel lists the premium questions, and
   an administrator is not necessarily on a Premium plan.
   ========================================================================== */
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, readToken } = require('./auth');

/* Paths written without the .html, because express.static is mounted with
   { extensions: ['html'] } and therefore answers /modules/invoice-scams just
   as happily as /modules/invoice-scams.html. Guarding only the spelling with
   the extension would leave the other one wide open. */
const GUARDED_PAGES = new Set([
  '/premium-modules',
  '/modules/client-data',
  '/modules/client-impersonation',
  '/modules/fake-recruiters',
  '/modules/invoice-scams',
]);

const GUARDED_SCRIPTS = new Set([
  '/js/quiz-data-premium.js',
]);

function classify(rawPath) {
  let p;
  try {
    p = decodeURIComponent(rawPath);
  } catch (err) {
    p = rawPath;
  }
  p = p.toLowerCase();
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);

  if (GUARDED_SCRIPTS.has(p)) return 'script';

  const withoutExt = p.endsWith('.html') ? p.slice(0, -5) : p;
  if (GUARDED_PAGES.has(withoutExt)) return 'page';

  return null;
}

/* The premium question bank is pulled in by quiz.html and results.html, which
   free users open for the free modules. Answering 403 there would put a red
   error in every free learner's console for a file their page never needed.
   So the request succeeds and the questions do not arrive - the account gets
   a stub where the bank would have been. Nothing is leaked and nothing that
   worked before breaks. */
function withholdScript(res, reason) {
  res.type('application/javascript').status(200).send(
    '/* SE Aware: the Premium question bank was not sent with this response.\n'
    + `   Reason: ${reason}\n`
    + '   The questions live behind the Premium plan and are withheld by the\n'
    + '   server, not hidden by the page. See /go-premium.html */\n'
  );
}

function lockPage(res, status, title, message) {
  res.status(status).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | SE Aware</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<style>
  body { min-height:100vh; display:grid; place-items:center; margin:0;
         background:#0B2545; color:#fff; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
  .card { max-width:34rem; padding:2.5rem; text-align:center; }
  h1 { font-size:1.5rem; margin:0 0 .75rem; }
  p { opacity:.85; line-height:1.6; }
  a.btn { margin:.25rem; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p>
      <a class="btn btn-light" href="/go-premium.html">See what Premium includes</a>
      <a class="btn btn-outline-light" href="/modules.html">Back to the free modules</a>
    </p>
  </div>
</body>
</html>`);
}

async function premiumGate(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const kind = classify(req.path);
  if (!kind) return next();

  // Who is asking?
  let claims = null;
  const token = readToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      // A half-finished login is not a login. The same rule the API follows:
      // a pendingToken is issued after the password but before the one-time
      // code, so honouring it here would let someone skip the code and read
      // the paid modules anyway.
      if (!payload.otp_pending) claims = payload;
    } catch (err) {
      // Expired or tampered-with: treat as a stranger.
    }
  }

  if (!claims) {
    if (kind === 'script') return withholdScript(res, 'not signed in');
    return lockPage(res, 403, 'Sign in to continue',
      'This page is part of the Premium plan. Sign in with a Premium account to read it.');
  }

  let row;
  try {
    const [rows] = await pool.query(
      'SELECT subscription_type, subscription_status, role FROM users WHERE user_id = ?',
      [claims.user_id]
    );
    row = rows[0];
  } catch (err) {
    // The plan could not be checked, so entitlement is unknown. Refusing is
    // the only safe answer: failing open here would hand the paid content to
    // everyone for the length of a database hiccup.
    console.error('[premium-gate] plan lookup failed:', err.message);
    if (kind === 'script') return withholdScript(res, 'plan could not be verified');
    return lockPage(res, 503, 'Temporarily unavailable',
      'We could not confirm your plan just now. Please try again in a moment.');
  }

  if (!row) {
    if (kind === 'script') return withholdScript(res, 'account not found');
    return lockPage(res, 403, 'Sign in to continue',
      'That account no longer exists. Sign in again to carry on.');
  }

  const isAdmin = row.role === 'admin';
  const isPremium = row.subscription_type === 'Premium' && row.subscription_status === 'active';

  if (!isAdmin && !isPremium) {
    if (kind === 'script') return withholdScript(res, 'account is on the Free plan');
    return lockPage(res, 403, 'This is a Premium feature',
      'Role-based modules cover the scenarios remote workers meet in client work. '
      + 'Upgrade to unlock them.');
  }

  return next();
}

module.exports = { premiumGate, classify, GUARDED_PAGES, GUARDED_SCRIPTS };
