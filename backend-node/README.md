# SE-AWARE Backend (Node.js + Express + MySQL)

Created by: Juan Paolo Dente

Matches the stack committed to in the SE-AWARE README ("swapping in the
Node.js and MySQL backend requires no changes to the interface"). This is
that backend — every FR-09 through FR-19 endpoint, tested against a real
MySQL/MariaDB instance before delivery, not just written and assumed correct.

## Setup

1. Install MySQL or MariaDB locally (or use a hosted one).
2. Create the database user:
   ```sql
   CREATE USER 'seaware'@'localhost' IDENTIFIED BY 'your-password';
   GRANT ALL PRIVILEGES ON se_aware.* TO 'seaware'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Run the schema, then the seed data:
   ```
   mysql -u root < sql/schema.sql
   mysql -u root < sql/seed.sql
   ```
4. Copy `.env.example` to `.env` and fill in your real DB password and a
   long random `JWT_SECRET`.
5. Install dependencies and start the server:
   ```
   npm install
   npm start
   ```
   Server runs on `http://localhost:3000` by default.
6. Create your first admin account: register normally through
   `POST /api/auth/register`, then run
   `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`
   in MySQL. There's no self-service way to become an admin — on purpose.

## Connecting the frontend

This is a REST API — point `store.js` (or whichever file currently
simulates storage) at `http://localhost:3000/api/...` instead of
`localStorage`/`sessionStorage`. Every response shape is documented below.
Store the JWT `token` from register/login in memory or `sessionStorage`,
then send it as `Authorization: Bearer <token>` on every subsequent request.

## API Reference

### Auth (FR-09, FR-10)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create an account. Body: `{first_name, email, password, subscription_type}` |
| POST | `/api/auth/login` | No | Log in. Body: `{email, password}` |
| POST | `/api/auth/logout` | Yes | Stateless — client just discards the token |
| GET | `/api/auth/me` | Yes | Current account's profile + plan |
| PATCH | `/api/auth/me/subscription` | Yes | Change plan (Free/Premium), no payment processing |

### Modules (FR-01, FR-16, FR-17, FR-19)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/modules` | Optional | List modules — Free-only for anonymous/Free users, all for Premium/admin |
| GET | `/api/modules/:slug` | Optional | One module — 403s on Premium content if not entitled |
| POST | `/api/modules` | Admin | Create a module (auto-creates its quiz) |
| PUT | `/api/modules/:id` | Admin | Edit a module, including toggling Free/Premium |
| DELETE | `/api/modules/:id` | Admin | Delete a module |

### Quizzes (FR-04, FR-13, FR-14, FR-18)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/quizzes/by-module/:slug` | Optional | Quiz questions, answer key stripped out |
| POST | `/api/quizzes/:quizId/submit` | Yes | Submit answers — scored server-side, updates progress |
| POST | `/api/quizzes/:quizId/questions` | Admin | Add a question |
| PUT | `/api/quizzes/questions/:id` | Admin | Edit a question |
| DELETE | `/api/quizzes/questions/:id` | Admin | Delete a question |

### Dashboard (FR-12, FR-15)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Progress + quiz history + latest assessment, in one call |
| GET | `/api/dashboard/recommendations` | Yes | Recommended modules based on weak areas or unstarted modules |

### Assessment (FR-11)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/assessment/questions` | No | The 10 questions, no answer key |
| POST | `/api/assessment/submit` | Yes | Submit answers — scored server-side, saved to the account |

## Administrator — a note for the ERD diagram

There's no separate `administrators` table. `users.role = 'admin'` is the
same pattern used in the Supabase version we evaluated earlier: one login
system, not two. If your ERD needs Administrator as its own labeled box for
the defense, that's fine visually — it maps to this same `users` table,
filtered by role.

## What was actually tested (not just written)

Every endpoint above was run against a real MariaDB instance during
development: registration, login, JWT verification, admin-only enforcement
(a non-admin genuinely gets rejected with 403), Premium content gating
(tested for a Free user, an anonymous visitor, and confirmed both correctly
blocked from Premium content while Free content stayed accessible to both),
quiz submission with server-side scoring, and the recommendation engine
correctly matching a failed assessment topic to the right module.

## What's not built yet

- File upload for module videos (FR-17's video part) — `multer` is
  installed as a dependency for this, but the actual upload route isn't
  wired up yet.
- Rate limiting / brute-force protection on login.
- Password reset flow.
- Admin's "Quiz Questions" and "Users & subscriptions" tabs in `admin.html`
  still operate on local, in-memory demo data — only the "Modules" tab is
  wired to the real API. Wiring the other two needs a `GET /api/admin/users`
  endpoint (not yet built) and per-quiz question CRUD hooked to the real
  `quiz_id` for each module (the API for this already exists at
  `/api/quizzes/:quizId/questions`, it just isn't called from that tab yet).

## Real behavior differences from demo mode (worth knowing before your defense)

- **New account default plan**: in demo mode, every new registration was
  automatically Premium (there was no real subscription concept to gate
  against). With the real backend, new accounts default to **Free**, matching
  FR-09/FR-10's actual intent — Premium is opt-in via the upgrade flow. This
  was confirmed by testing: a fresh registration lands as Free, and that
  account is then correctly blocked from Premium module pages until upgraded.
- **Session persistence**: the JWT is stored in `sessionStorage` (not
  `localStorage`), intentionally, so "signs out when the tab closes" still
  holds true, matching language used elsewhere in this codebase's UI copy
  about the platform's session handling.
