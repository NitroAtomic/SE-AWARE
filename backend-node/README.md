# SE-AWARE Backend (Node.js + Express + MySQL)

Created by: Juan Paolo Dente

Matches the stack committed to in the SE-AWARE README ("swapping in the
Node.js and MySQL backend requires no changes to the interface"). This is
that backend, including authenticated account, learning, administration,
chatbot, and subscription-payment routes.

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
4. Copy `.env.example` to `.env` and fill in the database, Stripe, chatbot,
   public `APP_URL`, and a random `JWT_SECRET` of at least 32 characters.
5. Install dependencies and start the server:
   ```
   npm install
   npm run db:seed:questions
   npm start
   ```
   Server runs on `http://localhost:3000` by default.
6. Create your first admin account: register normally through
   `POST /api/auth/register`, then run
   `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`
   in MySQL. There's no self-service way to become an admin — on purpose.

For an existing database created with the older schema, run
`sql/migration-payments.sql` once first. Configure Stripe to send
`checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`, and `invoice.payment_failed` to
`https://YOUR_DOMAIN/api/payments/webhook`.

## Connecting the frontend

The Express app serves the frontend and REST API from the same origin. The
frontend selects that origin automatically; set `window.SE_API_BASE` only
when the API intentionally lives on another origin.
Store the JWT `token` from register/login in memory or `sessionStorage`,
then send it as `Authorization: Bearer <token>` on every subsequent request.

## API Reference

### Auth (FR-09, FR-10)
| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a Free account. Body: `{first_name, last_name, email, password}` |
| POST | `/api/auth/login` | No | Log in. Body: `{email, password}` |
| POST | `/api/auth/logout` | Yes | Stateless — client just discards the token |
| GET | `/api/auth/me` | Yes | Current account's profile + plan |

### Chat, payments, progress, and administration

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/chat` | No | Ask the server-configured n8n or Gemini assistant |
| POST | `/api/payments/checkout-session` | Yes | Start Stripe subscription Checkout |
| POST | `/api/payments/portal-session` | Yes | Open Stripe billing management |
| POST | `/api/payments/webhook` | Stripe signature | Synchronize verified subscription state |
| PUT/DELETE | `/api/progress/:slug` | Yes | Persist or remove module completion |
| GET/PATCH/DELETE | `/api/admin/users...` | Admin | Manage users and subscriptions |
| GET | `/api/admin/questions`, `/api/admin/quizzes` | Admin | Load quiz management data |

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
| GET | `/api/assessment/latest` | Yes | Load the latest saved assessment |
| POST | `/api/assessment/submit` | Yes | Save the result scored by the bundled assessment UI |

## Administrator — a note for the ERD diagram

There's no separate `administrators` table. `users.role = 'admin'` is the
same pattern used in the Supabase version we evaluated earlier: one login
system, not two. If your ERD needs Administrator as its own labeled box for
the defense, that's fine visually — it maps to this same `users` table,
filtered by role.

## Verification

The automated smoke tests cover health reporting, chatbot validation and
provider configuration, authentication enforcement on payment routes, static
frontend serving, and blocking backend source files. Run a real MySQL and
Stripe test-mode checkout before a production release.

## Operational notes

- Password reset and transactional email require an email provider and are
  not included in this repository.
- Run `npm test` for route smoke tests and `npm run check` for syntax checks.
- `/api/health` checks the database and returns 503 when it is unavailable.

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
