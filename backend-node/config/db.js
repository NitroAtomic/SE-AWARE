// config/db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const common = {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4',
};

/* How the TLS connection to the database is set up.
 *
 * Managed MySQL providers (Aiven among them) do not use a certificate from
 * one of the public authorities your computer already trusts. They sign their
 * own, and hand you the matching CA certificate to check it against.
 *
 * That means "verify the certificate" only works if we actually give Node
 * that CA. Without it, a strict connection fails with a self-signed
 * certificate error, and the usual shortcut is to turn verification off -
 * which leaves the connection encrypted but no longer proof that the server
 * on the other end is really the database.
 *
 * So, in order:
 *   1. DB_SSL_CA_CERT - the certificate text itself. Best fit for Render,
 *      where there is nowhere to put a file. Paste the whole PEM in.
 *   2. DB_SSL_CA      - a path to a .pem file, relative to backend-node/.
 *                       Easier when working locally. Defaults to certs/ca.pem.
 *   3. Neither        - warn loudly and still verify, rather than quietly
 *                       downgrading to an unverified connection.
 *
 * DB_SSL_REJECT_UNAUTHORIZED=false disables verification deliberately. It is
 * a last resort for getting unblocked, not something to leave switched on.
 */
function sslOptions() {
  if (process.env.DB_SSL !== 'true') return undefined;

  // An explicit opt-out always wins, so there is a way out of a bad cert.
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    console.warn(
      '[db] DB_SSL_REJECT_UNAUTHORIZED=false - the connection is encrypted but\n' +
      '     the server certificate is NOT being checked. Fine for a quick test,\n' +
      '     not for anything you leave running. Set DB_SSL_CA_CERT instead.'
    );
    return { rejectUnauthorized: false };
  }

  const inlineCert = process.env.DB_SSL_CA_CERT;
  if (inlineCert && inlineCert.trim()) {
    // Render stores multi-line values fine, but some tools flatten newlines
    // into a literal backslash-n, so put those back.
    return { ca: inlineCert.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }

  const caPath = process.env.DB_SSL_CA
    ? path.resolve(__dirname, '..', process.env.DB_SSL_CA)
    : path.join(__dirname, '..', 'certs', 'ca.pem');

  if (fs.existsSync(caPath)) {
    return { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
  }

  console.warn(
    '[db] DB_SSL is on but no CA certificate was found.\n' +
    `     Looked for: ${caPath}\n` +
    '     Get it from your provider (Aiven: service Overview, CA certificate,\n' +
    '     Show) and either save it there or paste it into DB_SSL_CA_CERT.\n' +
    '     Connecting with verification on, which WILL fail if the provider\n' +
    '     uses its own certificate authority.'
  );
  return { rejectUnauthorized: true };
}

const ssl = sslOptions();

const pool = process.env.DATABASE_URL
  ? mysql.createPool({ uri: process.env.DATABASE_URL, ...common, ssl })
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'seaware',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'se_aware',
      ...common,
      ssl,
    });

module.exports = pool;
