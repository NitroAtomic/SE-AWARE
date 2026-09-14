// config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const common = {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4',
};

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined;
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
