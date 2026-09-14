# SE Aware

### Web-Based Social Engineering Awareness Platform for Remote Workers

An educational platform that teaches remote workers, freelancers, and virtual assistants how to recognise and respond to social engineering attacks. The free tier needs no account at all; a premium tier adds a real account system, saved progress, an awareness assessment, and role-based modules.

**Capstone 1 project (MO-IT200D1) · Group 4, Section S3102**
Mapúa Malayan Digital College · BS Information Technology, major in Network and Cybersecurity

| | |
|---|---|
| **Team** | Shane Mishael G. Abrasaldo · Kim Charlotte V. Anicete · Juan Paolo Dente · Jyan O. Estanislao · Joshua R. Ricohermozo |
| **Mentor / Adviser** | Ryan Dalmacio |
| **Program Head** | Mario Pison Jr. |
| **Panel** | Frances Barbon · Aldrin John Tamayo |

---

## What this build covers

This repository implements the **free tier** of the documented system in full, every requirement from FR-01 through FR-08, and every non-functional requirement in Chapter III.

| Req | Requirement | Status |
|---|---|---|
| FR-01 | Six learning modules (phishing, spear phishing, vishing, smishing, pretexting, safe practices) | Complete |
| FR-02 | Plain-language reading materials in every module | Complete, 1,200–1,900 words per module |
| FR-03 | Embedded educational videos where available | Complete, all six videos embedded |
| FR-04 | Ten-question randomised quiz after every attack module | Complete, 15-question bank per module, 10 drawn |
| FR-05 | Safe Practices section for remote workers | Complete, 8-topic accordion |
| FR-06 | AI chatbot as a floating widget on every page | Complete, **CyberWise**, n8n + Gemini, with offline fallback |
| FR-07 | Free tier fully accessible without registration or login | Complete, the six free modules, quizzes, and chatbot need no account |
| FR-08 | Responsive across desktop, tablet, and mobile | Complete, verified at 360 / 768 / 1024 / 1440px |

The **premium tier** is implemented for real, backed by a Node.js + Express API and a MySQL database (`backend-node/`). Accounts, sessions, progress, quiz history, and assessment results persist properly rather than living in browser storage.

| Test ID | Feature | Status |
|---|---|---|
| AU-01/02/03 | Registration, login, logout | Complete, bcrypt-hashed passwords, JWT sessions |
| AS-01/02 | Assessment score and awareness level | Complete, 15 questions, Beginner/Intermediate/Advanced |
| DB-01/02 | Dashboard progress and quiz history | Complete |
| RC-01, AIX-02 | Weak-area recommendations | Complete, topics below 60% drive module suggestions |
| PA-01/02 | Free-tier restriction and premium access | Complete, role-based modules gated |
| AD-01..04 | Admin login and CRUD | Complete, role-checked server-side, writes to the database |

**Premium depth.** The four role-based modules are 1,425 to 1,550 words each, matching the free modules, and each carries its own 15-question bank. Premium adds roughly 5,900 words and 60 questions on top of the free tier rather than summarising it.

What is **not** enabled by default: Stripe payment processing and the live AI chatbot. Both are fully implemented in the backend, but stay dormant until their API keys are supplied, and the endpoints return a clear "not configured" response instead of failing. Password reset is not implemented. See *Scope and honest limits* below.

---

## Technology stack

**Frontend**, unchanged from Chapter III. No framework, no bundler, no build step.

- **HTML5**, semantic markup, one file per page
- **CSS3**, a single custom stylesheet (`css/style.css`) layered over Bootstrap
- **Bootstrap 5.3.3**, via CDN, for the responsive grid, navbar, accordion, and utilities
- **Bootstrap Icons 1.11.3**, via CDN
- **Vanilla JavaScript (ES6)**, plain `<script>` tags, no modules, no transpilation

**Backend** (`backend-node/`), added for the premium tier.

- **Node.js + Express 5**, REST API
- **MySQL 8**, via `mysql2` with a connection pool
- **bcrypt**, password hashing
- **jsonwebtoken (JWT)**, stateless sessions
- **Stripe**, subscription checkout and billing portal, optional
- **n8n or Google Gemini**, the chatbot provider, optional

The frontend still runs standalone against GitHub Pages when no API is reachable. The backend serves the same frontend from its own origin when you run it locally, so there is no CORS configuration to do for the common case.

---

## Running it locally

### Free tier only, no setup

The free tier is pure static files and needs nothing installed:

```
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Serving the folder is preferable to opening the file directly, because `quiz.html` reads a `?module=` query parameter and some browsers restrict that on `file://` URLs. Premium pages will show a clear message that the API is unreachable, and the free tier is unaffected.

### Full stack, with accounts and the database

**1. Create the database.** In MySQL Workbench or the CLI, run the files in `backend-node/sql/` in this order:

```
mysql -u root < backend-node/sql/schema.sql
mysql -u root < backend-node/sql/migration-payments.sql
mysql -u root < backend-node/sql/seed.sql
```

**2. Create the application's database user:**

```sql
CREATE USER 'seaware'@'localhost' IDENTIFIED BY 'a-password-you-choose';
GRANT ALL PRIVILEGES ON se_aware.* TO 'seaware'@'localhost';
FLUSH PRIVILEGES;
```

**3. Configure the API.** Copy `backend-node/.env.example` to `backend-node/.env` and fill in `DB_PASSWORD` and a `JWT_SECRET` of at least 32 random characters. Leave the Stripe and AI keys blank unless you intend to enable those features.

**4. Load the quiz questions into the database.** The seed file creates the modules and empty quizzes; this fills in the 135 authored questions:

```
cd backend-node
npm install
npm run db:seed:questions
```

**5. Run it:**

```
npm start
```

The API and the frontend are both served from <http://localhost:3000>. Check <http://localhost:3000/api/health>, a healthy response is `{"status":"ok","database":"connected"}`. If it reports `degraded`, the database credentials in `.env` are wrong.

---

## CyberWise, the learning assistant

The assistant is named **CyberWise** and appears as a floating shield on every page.
The platform is SE Aware; CyberWise is the assistant inside it. It is locked to the six
course topics by two independent layers, a browser-side guard and the n8n system prompt,
and it distinguishes three outcomes rather than two: a real answer, a request to clarify
when the question is on topic but vague, and a refusal only when the question genuinely
belongs to another subject.

## Appearance: light and dark

Every page supports a light and a dark theme. The toggle sits in the navigation bar.
With no explicit choice the site follows the operating system's setting, and an explicit
choice is remembered in `localStorage` under a single key holding only the string
`light` or `dark`. `js/theme.js` is the one script loaded synchronously in `<head>`,
because applying the theme after first paint would flash a white page at anyone who
prefers dark. Colour is expressed entirely in design tokens, so the dark theme overrides
variables rather than duplicating component rules. Contrast is verified by the QA suite
in both themes.

## Configuring the AI chatbot

The chatbot works immediately in **offline demonstration mode**, answering from a curated local knowledge base that mirrors the six modules. That is enough to demo the interface and to satisfy test cases FT-09, FT-10, and AI-06.

To connect the live Gemini model, edit **one line** at the top of `js/chatbot.js`:

```js
var N8N_WEBHOOK_URL = "REPLACE_WITH_YOUR_N8N_PRODUCTION_WEBHOOK_URL";
```

**Two guides cover this end to end:**
- [`FREE-AI-SETUP.md`](FREE-AI-SETUP.md) shows how to run the whole thing at zero cost, with a defence-day checklist.
- [`N8N-CHATBOT-SETUP.md`](N8N-CHATBOT-SETUP.md) has the node configuration and the ready-to-paste system prompt that locks the assistant to the six course topics.

### The n8n workflow

```
Browser  →  n8n Webhook (POST)  →  Gemini API  →  Respond to Webhook  →  Browser
```

**Request the browser sends**

```json
{ "message": "How do I know if an email is phishing?" }
```

**Response n8n must return**

```json
{ "reply": "..." }
```

The client also accepts `output` or `text` as the reply field, since n8n nodes name it differently depending on configuration.

Four things to set up in n8n:

1. A **Webhook** node, method POST, mode "Using Respond to Webhook node".
2. A **Gemini / HTTP Request** node carrying a system prompt that constrains the assistant to social engineering awareness for remote workers, plain language at roughly a Grade 8 reading level, no requests for personal information, and a polite redirect for anything out of scope.
3. A **Respond to Webhook** node returning the JSON above.
4. **CORS headers** allowing your GitHub Pages origin, without this the browser will block the response.

> **Security note.** The Gemini API key belongs in n8n, never in this repository. Client-side JavaScript is readable by anyone who opens DevTools, so a key placed here would be public the moment the site is deployed. This is why the browser talks to n8n rather than to Google directly.

---

## Adding the module videos

Each module page carries a clearly marked constant near the bottom of the file:

```js
var MODULE_VIDEO_ID = "";   // ← paste the YouTube video ID here
```

Paste the ID (the part after `watch?v=`) and the responsive 16:9 embed renders automatically. Leave it empty and a placeholder card is shown instead, so a missing video never breaks the page layout.

Videos are embedded via `youtube-nocookie.com` rather than self-hosted, keeping the site static and avoiding server load, as documented in the non-functional requirements.

---

## Deploying

### GitHub Pages, free tier only

GitHub Pages serves static files only, so it can host the free tier but **cannot run the backend**. Deployed this way, the six modules, their quizzes, and the offline chatbot all work; premium pages will report that the API is unreachable.

1. Push this folder to a GitHub repository.
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch** · Branch: **main** · Folder: **/ (root)**
4. Save. The site publishes at `https://<username>.github.io/<repo>/` within a minute or two.

### Full stack

The premium tier needs somewhere that runs Node.js and reaches a MySQL database, Render, Railway, and Fly.io all have suitable free or low-cost tiers. Because `server.js` serves the frontend from its own origin, deploying the backend deploys the whole site together, and there is no separate frontend host or CORS configuration to manage.

Set the same variables from `.env.example` in the host's environment settings rather than committing them, and point `APP_URL` and `CORS_ORIGINS` at the deployed URL.

Deploy early. Appendix A of the paper needs a live link, and having a stable URL well before the defence is worth more than a perfect one on the day.

---

## File map

```
├── index.html                  Home, hero, survey statistics, module grid
├── about.html                  What the platform is, and what it deliberately does not do
├── modules.html                Module index with "what you will learn" per module
├── quiz.html                   Quiz engine, reads ?module= from the URL
├── results.html                Score, band, and per-question review
│
│   ── premium tier ──
├── register.html               Create an account (client-side validation only)
├── login.html                  Sign in
├── go-premium.html             Freemium comparison + plan switch (no payment)
├── assessment.html             15-question awareness assessment
├── dashboard.html              Progress · quiz history · recommendations
├── premium-modules.html        Index of the four role-based modules (gated)
├── admin.html                  Administrator portal (separate, not in nav)
│
├── modules/
│   ├── phishing.html           Email phishing, fake login pages, QR phishing
│   ├── spear-phishing.html     Targeted attacks built from public professional data
│   ├── smishing.html           SMS phishing, package, prize, and bank lures
│   ├── vishing.html            Voice phishing, OTP harvesting, AI voice cloning
│   ├── pretexting.html         Invoice fraud, vendor onboarding, impersonation
│   └── safe-practices.html     Eight-habit reference guide (no quiz, by design)
├── css/
│   └── style.css               Design tokens, components, responsive rules
├── js/
│   ├── main.js                 Nav state, footer year, shared helpers
│   ├── theme.js                Light/dark theme, loaded synchronously in <head>
│   ├── quiz-data.js            75 authored questions, 15 per free module
│   ├── quiz-data-premium.js    60 authored questions, 15 per premium module
│   ├── quiz.js                 Randomisation, scoring, results rendering
│   ├── chatbot.js              Floating assistant, n8n client, offline fallback
│   ├── backend-config.js       Where the API lives; blank means offline mode
│   ├── store.js                State layer, talks to the API, falls back offline
│   ├── account.js              Nav account state, premium gating, progress control
│   ├── auth.js                 Register, login, upgrade
│   ├── assessment-data.js      15 assessment questions across 6 topics
│   ├── assessment.js           Scoring, levels, weak-area detection
│   ├── dashboard.js            Progress, quiz history, recommendations
│   └── admin.js                Admin panel CRUD
│
├── backend-node/               Node.js + Express + MySQL API
│   ├── server.js               App setup, CORS, routes, static hosting
│   ├── config/
│   │   └── db.js               MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             JWT verification, requireAuth / requireAdmin
│   ├── routes/
│   │   ├── auth.js             Register, login, logout, current user
│   │   ├── modules.js          Module list and detail, premium gating, admin CRUD
│   │   ├── quizzes.js          Quiz delivery, scoring, question CRUD
│   │   ├── progress.js         Per-module completion tracking
│   │   ├── assessments.js      Assessment submission and latest result
│   │   ├── dashboard.js        Aggregated dashboard data and recommendations
│   │   ├── admin.js            User, question, and quiz administration
│   │   ├── payments.js         Stripe checkout, billing portal, webhooks
│   │   └── chat.js             Chatbot proxy to n8n or Gemini
│   ├── sql/
│   │   ├── schema.sql          Tables, indexes, constraints
│   │   ├── migration-payments.sql  Stripe columns and webhook idempotency
│   │   └── seed.sql            The ten modules and their quizzes
│   ├── scripts/
│   │   └── seed-questions.js   Loads the authored question banks into the DB
│   └── test/
│       └── server.test.js      Automated API tests
├── assets/img/                 Image assets
├── FREE-AI-SETUP.md            Zero-cost setup path and defence-day checklist
├── N8N-CHATBOT-SETUP.md        Live Gemini setup and the topic-lock system prompt
├── TESTING.md                  Test matrix for the testing phase
└── README.md
```

---

## How the quiz randomisation works

Each attack module has a bank of **15** questions, of which at least **6 are scenario-based** (a realistic situation, then a question about what to do). On every attempt the engine:

1. Shuffles the whole bank with a Fisher-Yates shuffle and takes the first 10.
2. Shuffles the four answer options for each question independently, remapping the correct-answer index so the answer follows its option.

Taking the same quiz twice therefore produces a different question set **and** a different option order, the behaviour test case FT-05 checks for. Automated runs during development showed 6–7 of 10 questions overlapping between consecutive attempts, with the order never identical.

---

## Privacy by design

**Guests are still anonymous.** Browsing the six free modules, taking their quizzes, and using the chatbot requires no account and stores nothing server-side. Quiz results pass from `quiz.html` to `results.html` through `sessionStorage`, which belongs to a single browser tab and is discarded when that tab closes.

**Premium accounts store the minimum needed to work.** First name, last name, email, a bcrypt hash of the password, subscription state, and learning progress. No plain-text password is ever written anywhere. There is no analytics or tracking on any tier, and chatbot messages are not persisted.

This matches the wording fix recommended for the paper: *"No personal data is collected from guest users; premium account data is limited to email, hashed password, and learning progress."*

This directly satisfies the paper's Security non-functional requirement and removes the data-privacy exposure that a user database would create.

---

## Scope and honest limits

The capstone paper contained a documented tension, and this build resolves it rather than working around it.

- The **non-functional requirements** specified no accounts, no login system, and no database.
- The **ERD, use case diagram, and sitemap** described registration, `password_hash`, subscription tiers, dashboards, and an admin panel.

**How this repository resolves it.** The free tier stays exactly as the non-functional requirements describe: six modules, quizzes, and the chatbot, with no account, no cookie, and nothing stored server-side. The premium tier is now built the way the ERD describes, with a real API and a real database behind it. Guests and account holders are two genuinely different paths through the same site, rather than one compromise that half-satisfies both.

**What to say at the defence.** *"The free tier needs no account and stores nothing. The premium tier is backed by a Node.js and Express API over MySQL, with bcrypt-hashed passwords and JWT sessions. Access control is enforced server-side, not just hidden in the interface, so a free-tier account calling the API directly for premium content still gets refused."*

### What is deliberately not enabled

**Payment processing, deliberately.** The paper's Scope and Limitations section excludes *"online payment gateway integration, automatic billing, or financial transaction processing"* from this study, and FR-10 covers account-level plan management only. The build follows that: `go-premium.html` changes the plan on the account directly through `PATCH /api/auth/me/subscription`, takes no payment, and says so on the page. That is the whole intended flow, not a placeholder for one.

Stripe route handlers do exist in `backend-node/routes/payments.js` from an earlier exploration, and stay dormant unless `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` are set. Nothing in the interface calls them. They are a starting point if a later build brings payments into scope; leave the keys unset and they have no effect.

**A note on the button.** It reads *Switch to Premium*, not *Upgrade securely*, and carries a line stating that no payment is taken. A platform that spends six modules teaching people to distrust convincing payment screens should not present a fake one of its own.

**The live AI chatbot.** Same pattern. CyberWise answers from a curated local knowledge base out of the box, which is enough for test cases FT-09, FT-10, and AI-06. Supplying `N8N_WEBHOOK_URL` or `GEMINI_API_KEY` switches it to the live model.

### Where quiz questions come from

Questions live in two places, deliberately.

`js/quiz-data.js` and `js/quiz-data-premium.js` hold the authored banks and ship with the static site, so the free tier works on GitHub Pages with no server. When a backend **is** connected, `quiz.js` fetches the bank from `GET /api/quizzes/by-module/:slug` instead, which means questions edited in the admin panel actually reach learners rather than sitting unused in the database.

Load the authored banks into the database once, after seeding the modules:

```
cd backend-node
npm run db:seed:questions
```

That reads the same `quiz-data` files and writes 135 questions across 9 banks. `safe-practices` has no quiz by design, so it stays empty.

**One behavioural difference worth knowing.** A database-backed attempt is scored on the server, because the API withholds `correct_option_index` while the quiz is in progress. The answer key comes back with the score at submission, which is what still allows the per-question review on `results.html`. The tradeoff is that instant right/wrong feedback after each question only appears in the offline path, where the answers are already in the browser; online, each answer is acknowledged and marked at the end. That is the correct way round for an assessment, and it means the answer key is never sitting in the page for anyone who opens DevTools.

### Not implemented

**Password reset.** There is no forgot-password flow. An account that loses its password cannot recover it without an administrator changing the row directly. This needs an email provider, which is out of scope for this build.

**Email verification.** Registration does not confirm the address is real.

**Rate limiting on login.** There is no lockout after repeated failed attempts, so the API is not hardened against brute force. Acceptable for a local academic deployment, not for public production.

---

## Accounts for the defence

There are no hard-coded demo credentials any more, because authentication is real now. Create the accounts you need before the defence and write the details down.

**A learner account.** Register through `register.html` with any email and a password of 8+ characters containing a letter and a number. New accounts start on the **Free** plan.

**A premium account.** Register as above, then open `go-premium.html` and click **Switch to Premium**. The plan changes on the account immediately, no payment and no checkout, which is what FR-10 specifies. **Revert to Free** on the same page switches back, which is the quickest way to demonstrate the free-tier gate during the defence.

**An administrator account.** Register normally, then promote the row directly in MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

There is deliberately no self-service way to become an administrator. Log out and back in afterwards so the new role is carried in a fresh session token.

**Seeding demo progress.** To show a populated dashboard rather than an empty one, complete two or three module quizzes and the awareness assessment on the account you plan to demo. That data persists in the database, so it is there when you come back to it, unlike the old session-only prototype.

---

## Testing

`TESTING.md` holds the test matrix.

**Backend API tests.** Run them with:

```
cd backend-node
npm test
```

These cover authentication, chatbot input validation and the unconfigured-provider response, that payment routes refuse unauthenticated callers, and that backend source files are not reachable over HTTP.

**Frontend checks.** During development the frontend was verified with headless Chromium across three suites:

- **Deep QA, 34 checks.** Duplicate IDs, image alt text, heading order, form labels, link text, unique titles, colour contrast sampled across **both themes**, every quiz end to end, video embeds, the demo account journey, the admin portal, deployment under a GitHub Pages project subpath, content hygiene, and the theme switch itself.
- **Free tier, 32 checks.** Page loads, dead links, content completeness, quiz randomisation and scoring, chatbot behaviour including out-of-scope refusal, login-free access, responsive layout at four widths, clean JavaScript console.
- **Premium tier, 25 checks.** Registration validation and success, no password leakage into storage, login and logout, assessment scoring and level derivation, weak-area detection and recommendations, dashboard progress and quiz history accuracy, free-tier gating and premium access, admin login and CRUD across modules, questions and users, and confirmation that the guest experience is completely unchanged.

**All frontend checks passed on the build they were run against.** Re-run them after the backend integration, since several premium-tier checks were written when that tier was session-only and may now assert the wrong behaviour.

Manual cross-browser testing (CT-01 through CT-07) still needs to be carried out by the team on real devices, since a headless engine cannot stand in for Safari on an actual iPhone.

---

## Maintenance

Per the paper's maintenance plan:

- Audit reading modules and replace outdated or broken video links each term
- Revise advisory text as social engineering tactics shift
- Expand the chatbot's knowledge base, both the n8n system prompt and the `KB` array in `js/chatbot.js`
- Re-run the link check before each submission
