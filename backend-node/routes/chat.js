const express = require('express');

const router = express.Router();
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
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
}

router.post('/', rateLimit, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters.' });
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
