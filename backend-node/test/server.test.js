const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';
process.env.NODE_ENV = 'test';
delete process.env.STRIPE_SECRET_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.N8N_WEBHOOK_URL;

const dbPath = require.resolve('../config/db');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { query: async () => [[{ ok: 1 }]] },
};

const app = require('../server');
let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
test.after(async () => new Promise((resolve) => server.close(resolve)));

test('health checks the database connection', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', database: 'connected' });
});

test('chat validates input and reports missing provider', async () => {
  let response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 400);
  response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'How do I spot phishing?' }) });
  assert.equal(response.status, 503);
});

test('payment routes require authentication', async () => {
  const response = await fetch(`${base}/api/payments/checkout-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  assert.equal(response.status, 401);
});

test('serves the frontend but not backend source', async () => {
  assert.equal((await fetch(`${base}/index.html`)).status, 200);
  assert.equal((await fetch(`${base}/backend-node/server.js`)).status, 404);
});
