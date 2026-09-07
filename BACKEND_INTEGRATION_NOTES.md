# Backend integration notes — Juan Paolo Dente

This documents exactly what changed to connect SE-AWARE to the real
Node.js + MySQL backend (`/backend-node`), and why, so the rest of the group
can review it quickly.

## How to turn the real backend on

1. Get `/backend-node` running (see its own README).
2. Open `js/backend-config.js` and set `window.SE_API_BASE` to your running
   backend's URL (`http://localhost:3000` for local dev).
3. That's it — every page picks this up automatically. Leave it blank (`""`)
   to run exactly as before, fully offline, no backend involved.

## The core design decision

Every function in `store.js` kept its exact original name and return shape.
No page-level HTML changed, and page scripts needed only small, targeted
edits — not rewrites — because of one architectural choice:

**`account.js`'s `DOMContentLoaded` handler is the single gatekeeper for
every page.** It now does `await window.SEStore.ready()` before anything
else runs, and only then dispatches the `se:ready` event that
`dashboard.js` and `assessment.js` already listened for. Because of that,
**those two files needed zero changes** — they were already built to wait
for a signal before reading state; that signal now genuinely means
"the real data has arrived from the server," not just "the page loaded."

## Files changed, and why

| File | Change |
|---|---|
| `js/store.js` | Full rewrite. Real API calls when `SE_API_BASE` is set and reachable; falls back to the exact original sessionStorage/demo behavior otherwise. See the file's own header comment for the full method-by-method mapping. |
| `js/backend-config.js` | **New file.** The one place the backend URL is set. |
| `js/account.js` | `DOMContentLoaded` handler now awaits `SEStore.ready()` first (the gatekeeper). Logout, and the module-complete toggle, are now `async`/`await`-aware since they can be real network calls now. |
| `js/auth.js` | Register and login handlers are now `async` and actually pass the password through to `SEStore` (the original prototype collected it but never used it, since there was nothing to check it against). Upgrade/downgrade click handlers are `async`-aware. Whole init is gated on `SEStore.ready()` to fix a race where `initUpgrade()` read `getUser()` before hydration could finish. |
| `js/quiz.js` | Init gated on `SEStore.ready()` (fixes the same kind of race — the Premium quiz check runs before the page interacts with anything). `finish()` is `async`, awaits `addQuizAttempt()`. |
| `js/admin.js` | Login now calls the real backend and checks `role === 'admin'` (identifier field doubles as the account's email when a backend is connected; demo mode's mock login is untouched). The **Modules tab** is fully wired to real `/api/modules` CRUD. The Quiz Questions and Users tabs are **not yet wired** — flagged clearly in the backend's own README, not silently left half-done. |
| `js/dashboard.js`, `js/assessment.js` | **No changes.** Already gated on `se:ready`. |
| `backend-node/routes/quizzes.js` | Added `POST /api/quizzes/record-attempt` — records an already-scored quiz result directly, since this codebase scores quizzes entirely client-side (`quiz-data.js`) by design, same as `assessment.js`. Re-scoring server-side against a second, separately-seeded question bank would require perfectly mirroring `quiz-data.js` question-for-question, which isn't realistic to keep in sync by hand. |
| `backend-node/routes/assessments.js` | Rewritten to store whatever the client already computed (score/level/byTopic/weakAreas), rather than re-scoring server-side against a different, smaller placeholder question bank that didn't match the real 15-question `assessment-data.js`. |
| `backend-node/sql/schema.sql` | `assessments` table restructured to store `score`, `total`, `by_topic` (JSON), matching the real frontend's data shape exactly, instead of the earlier placeholder shape. |

## What was actually tested (all against a real MySQL database, not assumed)

- Registered a real account through the actual registration form → confirmed
  the row exists in MySQL's `users` table.
- Took a full 10-question module quiz through the real UI → confirmed the
  score landed in `quiz_results` and the module shows `completed` in
  `progress`, and that the dashboard correctly displays both.
- Took the full 15-question assessment through the real UI → confirmed the
  complete per-topic breakdown (`by_topic`) saved correctly.
- Promoted an account to admin directly in MySQL, logged into `admin.html`
  with real credentials, clicked "Add module" → confirmed a real row
  appeared in the `modules` table.
- Registered a fresh account (confirmed it defaults to **Free**, not
  Premium — a real, intentional behavior difference from demo mode, see
  the backend README), then confirmed it was correctly blocked from a
  Premium module page by the real gate.

## One bug I caught and fixed during this same testing pass

The very first version of `backend-config.js` was created but never
actually `<script>`-included in any HTML file. Every page silently fell
back to demo mode, registrations "succeeded" but never touched the real
database — no error was thrown anywhere, it just quietly used the fallback
path exactly as designed to when no backend is configured. Caught this by
checking actual network requests during a live Playwright test rather than
trusting that the code "should" work, added the missing script tag to all
23 HTML files, and re-verified with the same test.
