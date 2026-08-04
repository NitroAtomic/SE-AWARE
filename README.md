# SE Aware

### Web-Based Social Engineering Awareness Platform for Remote Workers

A free, publicly accessible, login-free educational website that teaches remote workers, freelancers, and virtual assistants how to recognise and respond to social engineering attacks.

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
| FR-06 | AI chatbot as a floating widget on every page | Complete, n8n + Gemini, with offline fallback |
| FR-07 | Fully accessible without registration or login | Complete, no accounts, no database, no cookies |
| FR-08 | Responsive across desktop, tablet, and mobile | Complete, verified at 360 / 768 / 1024 / 1440px |

The **premium tier** is also implemented, as a **prototype**: every page in the sitemap and every actor in the use case diagram is demonstrable end to end, backed by session-only browser storage rather than a database.

| Test ID | Feature | Status |
|---|---|---|
| AU-01/02/03 | Registration, login, logout | Prototype, client-side validation, no password stored |
| AS-01/02 | Assessment score and awareness level | Complete, 15 questions, Beginner/Intermediate/Advanced |
| DB-01/02 | Dashboard progress and quiz history | Complete |
| RC-01, AIX-02 | Weak-area recommendations | Complete, topics below 60% drive module suggestions |
| PA-01/02 | Free-tier restriction and premium access | Complete, role-based modules gated |
| AD-01..04 | Admin login and CRUD | Prototype, mock sign-in, in-memory CRUD |

**Premium depth.** The four role-based modules are 1,425 to 1,550 words each, matching the free modules, and each carries its own 15-question bank. Premium adds roughly 5,900 words and 60 questions on top of the free tier rather than summarising it.

What the prototype deliberately does **not** do: no server, no database, no real authentication, no payment gateway. See *Known scope boundary* below for how to present this to the panel.

---

## Technology stack

Exactly as documented in Chapter III. No framework, no bundler, no build step, no npm dependencies.

- **HTML5**, semantic markup, one file per page
- **CSS3**, a single custom stylesheet (`css/style.css`) layered over Bootstrap
- **Bootstrap 5.3.3**, via CDN, for the responsive grid, navbar, accordion, and utilities
- **Bootstrap Icons 1.11.3**, via CDN
- **Vanilla JavaScript (ES6)**, plain `<script>` tags, no modules, no transpilation
- **n8n + Google Gemini API**, the chatbot's server-side workflow
- **GitHub Pages**, static hosting target

---

## Running it locally

No installation required. Either open `index.html` directly in a browser, or serve the folder:

```bash
# Python 3 (already installed on most machines)
python3 -m http.server 8000

# or Node
npx serve .
```

Then visit <http://localhost:8000>.

Serving the folder is preferable to opening the file directly, because `quiz.html` reads a `?module=` query parameter and some browsers restrict that on `file://` URLs.

---

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

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. **Settings → Pages → Build and deployment**
3. Source: **Deploy from a branch** · Branch: **main** · Folder: **/ (root)**
4. Save. The site publishes at `https://<username>.github.io/<repo>/` within a minute or two.

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
│   ── premium tier prototype ──
├── register.html               Create an account (client-side validation only)
├── login.html                  Sign in
├── go-premium.html             Freemium comparison + Simulate Upgrade
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
│   ├── quiz-data.js            75 authored questions, 15 per free module
│   ├── quiz-data-premium.js    60 authored questions, 15 per premium module
│   ├── quiz.js                 Randomisation, scoring, results rendering
│   ├── chatbot.js              Floating assistant, n8n client, offline fallback
│   ├── store.js                Prototype state layer, the API swap point
│   ├── account.js              Nav account state, premium gating, progress control
│   ├── auth.js                 Register, login, simulated upgrade
│   ├── assessment-data.js      15 assessment questions across 6 topics
│   ├── assessment.js           Scoring, levels, weak-area detection
│   ├── dashboard.js            Progress, quiz history, recommendations
│   └── admin.js                Admin panel CRUD
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

There is no account system, no login, no database, and no analytics. Nothing you type into the chatbot is stored after the page closes. Quiz results are handed from `quiz.html` to `results.html` through `sessionStorage`, which belongs to a single browser tab and is discarded when that tab closes, the results never leave the device.

This directly satisfies the paper's Security non-functional requirement and removes the data-privacy exposure that a user database would create.

---

## Known scope boundary

The capstone paper contains a documented tension worth stating plainly:

- The **non-functional requirements** specify no accounts, no login system, and no database.
- The **ERD, use case diagram, and sitemap** describe registration, `password_hash`, subscription tiers, dashboards, and an admin panel.

Both cannot describe the same build. The recommended wording fix for the paper: *"No personal data is collected from guest users; premium account data is limited to email, hashed password, and learning progress."*

**How this repository resolves it.** The free tier is a real, complete implementation. The premium tier is a working prototype with session-only storage, enough to walk a panel through registration, assessment, dashboard, gating, and administration, without claiming a database that does not exist. Every premium page carries a visible "Prototype, session data only" badge, and `js/store.js` documents the exact API endpoint each function would call in a real build.

**What to say at the defence.** *"The free tier is fully implemented and deployed. The premium tier is implemented as a functional prototype with session-based persistence, the complete user journey works, and the storage layer is abstracted so that swapping in the Node.js and MySQL backend requires no changes to the interface. That backend implementation is Capstone 2 scope."*

That is both accurate and stronger than either overclaiming a database or having nothing to show for the ERD.

**One design decision worth defending explicitly.** No password is stored anywhere in this prototype, not in plain text, not hashed, not in memory. Registration validates format and discards the value. This is deliberate: a platform that spends six modules telling people to protect their credentials should not model client-side password storage, and a hashed password in `sessionStorage` would be security theatre rather than security. If a panelist asks why login accepts any password for a registered email, that is the answer.

---

## Demo credentials for the defence

| What | Username / email | Password |
|---|---|---|
| **Demo learner account** (no registration needed) | `demo@seaware.ph` | `seaware2026` |
| **Your own learner account** | any email you register with | any 8+ characters with a letter and a number |
| **Administrator panel** (`admin.html`) | `admin` | `seaware2026` |

The admin sign-in is a mock and accepts any username of 3 or more characters with any password of 8 or more, because there is no server to authenticate against. The credentials above are simply the ones printed on the sign-in card so the team demonstrates the same thing every time.

The demo account signs in without registering first, arrives on the Premium plan, and is pre-loaded with four completed modules, three quiz attempts, and an Intermediate assessment result, so the dashboard demonstrates progress, quiz history, and recommendations all at once.

**New accounts are created on the Premium plan**, so registering gives immediate access to the awareness assessment, the dashboard, and the role-based modules. To demonstrate the Free-tier gate, open the account menu, go to Go Premium, and use **Revert to Free**, or change the plan on your own row in the admin panel's Users tab.

---

## Testing

`TESTING.md` holds the test matrix. During development the build was verified automatically with headless Chromium across two suites:

- **Free tier, 32 checks.** Page loads, dead links, content completeness, quiz randomisation and scoring, chatbot behaviour including out-of-scope refusal, login-free access, responsive layout at four widths, clean JavaScript console.
- **Premium tier, 24 checks.** Registration validation and success, no password leakage into storage, login and logout, assessment scoring and level derivation, weak-area detection and recommendations, dashboard progress and quiz history accuracy, free-tier gating and premium access, admin login and CRUD across modules, questions and users, and confirmation that the guest experience is completely unchanged.

**All 56 passed on the final build.**

Manual cross-browser testing (CT-01 through CT-07) still needs to be carried out by the team on real devices, since a headless engine cannot stand in for Safari on an actual iPhone.

---

## Maintenance

Per the paper's maintenance plan:

- Audit reading modules and replace outdated or broken video links each term
- Revise advisory text as social engineering tactics shift
- Expand the chatbot's knowledge base, both the n8n system prompt and the `KB` array in `js/chatbot.js`
- Re-run the link check before each submission
