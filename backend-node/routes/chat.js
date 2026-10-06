const express = require('express');
const pool = require('../config/db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/* ---------------------------------------------------------------------------
   What the assistant will and will not discuss, by plan
   ---------------------------------------------------------------------------
   The role-based modules - client impersonation, invoice scams, fake
   recruiters, client data handling - are the Premium half of the platform.
   An assistant that happily explains all of it to anyone who asks hands over
   the paid material through a side door.

   The word list and the refusal below are the capstone's, kept word for word
   so both sites answer the same question the same way. The test is deliberately
   crude: a question that mentions a Premium subject by name is treated as a
   Premium question. It costs the occasional free question that happened to use
   the word "client", which is the safer way to be wrong.

   Everything else - phishing, smishing, vishing, pretexting, passwords, home
   network safety - is free for everyone, signed in or not.
   --------------------------------------------------------------------------- */
const PREMIUM_TOPIC_WORDS = [
  'recruiter', 'recruiters', 'recruitment', 'invoice', 'invoices', 'invoicing',
  'billing', 'payroll', 'contract', 'contracts', 'freelance', 'freelancer',
  'client', 'clients', 'vendor', 'vendors', 'executive', 'impersonation',
  'impersonating', 'impersonate',
];

const PREMIUM_ONLY_REPLY = [
  'That one is covered in the Role-based modules, which are part of Premium.',
  'They walk through client impersonation, invoice scams, fake recruiters and',
  'client data handling, written for freelance and contract work.',
  '',
  'I can still help with phishing, smishing, vishing, pretexting and safe',
  'practices for remote work, which are free for everyone.',
].join(' ').trim();

function mentionsPremiumTopic(text) {
  const words = String(text).toLowerCase().match(/[a-z]+/g) || [];
  return words.some((word) => PREMIUM_TOPIC_WORDS.includes(word));
}

/* The plan is read from the database, never from the request. A browser can
   send whatever it likes; what it cannot do is change the row. */
async function planFor(user) {
  if (!user) return 'Free';
  try {
    const [rows] = await pool.query(
      'SELECT subscription_type, subscription_status FROM users WHERE user_id = ?',
      [user.user_id]
    );
    const row = rows[0];
    if (row && row.subscription_type === 'Premium' && row.subscription_status === 'active') {
      return 'Premium';
    }
    return 'Free';
  } catch (err) {
    // If the plan cannot be read, assume the cheaper one. Guessing Premium
    // during a database wobble would give the paid answers away.
    console.error('[chat] plan lookup failed:', err.message);
    return 'Free';
  }
}
const requests = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.CHAT_RATE_LIMIT || 20);

const SYSTEM_PROMPT = `You are CyberWise, a concise educational assistant for remote workers. Only answer questions about phishing, spear phishing, smishing, vishing, pretexting, social engineering, account/device safety, incident response, and this learning platform. Never claim to scan or verify a link, file, sender, or device. Do not request passwords, one-time codes, payment details, or other secrets. If a user may be in immediate danger, advise them to stop interacting, preserve evidence, contact the relevant account provider or bank through an independently verified channel, and report the incident to local authorities. Refuse unrelated requests briefly.`;

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const recent = (requests.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return res.status(429).json({ error: 'Too many chat requests. Please wait a minute.' });
  recent.push(now);
  requests.set(key, recent);
  next();
}

async function askN8n(message) {
  const response = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(process.env.N8N_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}` } : {}) },
    body: JSON.stringify({ message, systemPrompt: SYSTEM_PROMPT }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`n8n returned ${response.status}`);
  const data = await response.json();
  return data.reply || data.output || data.text;
}

async function askGemini(message) {
  // Google retires model names, and a retired one fails as a 404 on the
  // request URL - which reads like a broken endpoint rather than a stale
  // default. gemini-2.0-flash was shut down, so this default moved on.
  // Override with GEMINI_MODEL rather than editing this line.
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      // maxOutputTokens caps the model's internal reasoning AND the visible
      // answer TOGETHER. The newer Gemini models think before they answer, so
      // a 500 ceiling left roughly forty words of actual reply and cut the
      // rest off mid-sentence - which reads like a broken bot, not a limit.
      // 2048 leaves room for both. The answers stay short because the system
      // prompt asks them to, not because the budget ran out.
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
  const data = await response.json();

  // Say so in the log when the answer was cut short rather than finished.
  // Without this a truncated reply is indistinguishable from a brief one,
  // which is exactly how the 500-token ceiling went unnoticed.
  const finish = data.candidates?.[0]?.finishReason;
  if (finish && finish !== 'STOP') {
    console.warn(`[chat] Gemini stopped early: ${finish}`);
  }

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
}

router.post('/', optionalAuth, rateLimit, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters.' });

  /* Decided before any AI provider is contacted. Sending the question off and
     then filtering the answer would still have put the paid material through
     a third party, and would still leave a window where the reply came back
     complete. Nothing leaves this server for a Premium question asked on a
     Free plan. */
  const plan = await planFor(req.user);
  if (plan !== 'Premium' && mentionsPremiumTopic(message)) {
    return res.json({ reply: PREMIUM_ONLY_REPLY, source: 'premium-only' });
  }

  if (!process.env.N8N_WEBHOOK_URL && !process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Chat provider is not configured.' });
  try {
    const reply = process.env.N8N_WEBHOOK_URL ? await askN8n(message) : await askGemini(message);
    if (!reply) throw new Error('Chat provider returned an empty response.');
    res.json({ reply });
  } catch (err) {
    console.error('[chat]', err.message);
    res.status(502).json({ error: 'The assistant is temporarily unavailable.' });
  }
});

module.exports = router;
