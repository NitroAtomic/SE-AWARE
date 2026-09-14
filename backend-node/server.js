// server.js
// SE-AWARE backend — Node.js + Express + MySQL
// Created by: Juan Paolo Dente

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const quizRoutes = require('./routes/quizzes');
const dashboardRoutes = require('./routes/dashboard');
const assessmentRoutes = require('./routes/assessments');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean);
if (process.env.APP_URL) allowedOrigins.push(process.env.APP_URL.replace(/\/$/, ''));
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }
    callback(new Error('Origin not allowed by CORS.'));
  },
  credentials: false,
}));

// Stripe signature verification requires the exact raw request bytes.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes.webhook);
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes.router);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);

// Serve the existing frontend from the same origin as the API. Block backend
// source files before mounting the static directory.
app.use('/backend-node', (req, res) => res.sendStatus(404));
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Origin not allowed by CORS.') return res.status(403).json({ error: err.message });
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`SE-AWARE listening on port ${PORT}`));
}

module.exports = app;
