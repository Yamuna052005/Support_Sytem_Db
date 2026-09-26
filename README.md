# SupportDesk: Support Ticket Management System

A full-stack support portal where **customers** raise and track support tickets and **support agents** manage, assign and respond to them.

| | |
|---|---|
| **Live app** | `https://<your-frontend>.onrender.com` *(fill in after deploying)* |
| **API** | `https://<your-api>.onrender.com/api` *(fill in after deploying)* |
| **Health check** | `GET /api/health` |

**Demo accounts** (all use the password `Password123!`):

| Role | Email |
|---|---|
| Agent | `agent@example.com` |
| Agent | `agent2@example.com` |
| Customer | `carol@example.com` |
| Customer | `dave@example.com` |

New customers can also sign up on the Register page.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Axios, Vite, plain responsive CSS |
| Backend | Node.js, Express 5, express-validator, helmet, cors |
| Database | MySQL 8 (`mysql2` driver, parameterised queries only) |
| Auth | JWT (`jsonwebtoken`, HS256) + bcrypt password hashing (`bcryptjs`) |
| Testing | Jest + Supertest (API tests), Postman collection |
| Deployment | Render (API + static frontend) + Aiven for MySQL |

## Features

**Authentication and security**
- Customer registration and login for both roles. Passwords are stored only as bcrypt hashes.
- JWTs are verified on every protected API call. Frontend routes are protected too, and logout clears the session.
- Authentication (`authenticate`: *who are you?*, which returns 401) is kept separate from authorisation (`authorize(role)` plus per-ticket ownership checks: *may you do this?*, which returns 403).
- Customers can never see or change another customer's tickets. Every query is scoped server-side.
- Registration always creates a `customer`. The role is never taken from the request body.
- Login gives the same response for a wrong email and a wrong password, so it does not reveal which accounts exist.
- All SQL is parameterised. Sort columns come from a whitelist, so user input is never interpolated into SQL.
- CORS is limited to the configured frontend origin(s), and `helmet` sets the security headers.
- Secrets come only from environment variables (`.env` is git-ignored).

**Customer**
- A dashboard of their own tickets, with search (subject/description) and status and priority filters.
- Create a ticket (subject, description, priority) with client-side and server-side validation.
- A ticket detail page with the full conversation. They can add comments.
- Edit their ticket while it is open or in progress, and withdraw (delete) it while it is still open.

**Agent**
- A dashboard with statistics: total, open, in progress, resolved, unassigned and assigned to me. Clicking a statistic card applies it as a filter.
- View all tickets, with search (subject, description, customer name/email, `#id`), filters (status, priority, assignee) and sorting (newest, recently updated, priority, status, subject; ascending or descending).
- Filters are kept in the URL, so a filtered view can be bookmarked or shared.
- Update status and priority, assign a ticket to any agent (or use "Assign to me"), reply, and delete spam or duplicate tickets.

**UX**
- Every page has loading and error states, with retry buttons.
- Form errors appear next to the field they belong to.
- The layout is responsive: on phones, the ticket table turns into stacked cards.

---

## Project structure

```
support-ticket-system/
├── backend/
│   ├── src/
│   │   ├── app.js               # Express app (exported for tests)
│   │   ├── server.js            # Starts the HTTP server
│   │   ├── config/              # env loading, MySQL pool
│   │   ├── middleware/          # authenticate / authorize, validation, error handler
│   │   ├── routes/              # URL + validation rules per resource
│   │   ├── controllers/         # request handling and business rules
│   │   ├── models/              # SQL (parameterised queries)
│   │   └── utils/
│   └── scripts/
│       ├── initDb.js            # npm run db:setup (applies schema + seed)
│       └── hashPassword.js      # npm run hash -- "password"
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client + API functions
│   │   ├── context/             # AuthContext (session, login, logout)
│   │   ├── components/          # reusable UI: FormField, TicketList, Badge, ...
│   │   ├── hooks/               # useTickets / useTicketFilters
│   │   ├── pages/               # Login, Register, dashboards, ticket pages
│   │   └── utils/               # validation + formatting helpers
│   ├── vercel.json / public/_redirects   # SPA rewrites for other hosts
├── database/
│   ├── schema.sql               # tables, keys, indexes
│   ├── seed.sql                 # sample users, tickets, comments
│   └── queries.sql              # example JOIN queries (incl. section 8)
├── tests/                       # Jest + Supertest API tests
├── postman/
│   └── SupportTicketSystem.postman_collection.json
├── render.yaml                  # Render Blueprint (API + frontend)
├── .env.example
└── README.md
```

---

## Running locally

### Prerequisites
- Node.js 18 or newer
- A MySQL 8 server (local, Docker or cloud)

### 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE support_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p support_tickets < database/schema.sql
mysql -u root -p support_tickets < database/seed.sql
```

If you don't have the `mysql` CLI, configure `backend/.env` (step 2) and run `npm run db:setup` from the `backend` folder. It applies `schema.sql` and then `seed.sql`.

> ⚠️ `schema.sql` drops the existing tables first.

### 2. Backend

```bash
cd backend
cp ../.env.example .env        # keep the backend section and fill in your DB credentials
npm install
npm run dev                    # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env           # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                    # http://localhost:5173
```

### Environment variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | API port (default 5000) |
| `NODE_ENV` | backend | `production` makes `JWT_SECRET` mandatory |
| `DATABASE_URL` | backend | `mysql://user:pass@host:port/db` (alternative to the `DB_*` variables) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | backend | MySQL connection |
| `DB_SSL` | backend | `true` for cloud databases that require TLS |
| `DB_SSL_CA` | backend | CA certificate (PEM) for verified TLS, e.g. Aiven's `ca.pem` |
| `DB_SSL_REJECT_UNAUTHORIZED` | backend | Leave as `true`. Set `false` only if no CA is available |
| `JWT_SECRET` | backend | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | backend | Token lifetime (default `1d`) |
| `CORS_ORIGIN` | backend | Comma-separated allowed frontend origins |
| `VITE_API_URL` | frontend | API base URL, including `/api` (used at build time) |

---

## Tests

### Automated (Jest + Supertest)

```bash
cd backend
npm test
```

There are 30 API tests in [`tests/`](tests). The model layer is mocked, so they run without a database. They cover:

- successful registration, and that a request cannot choose its own role; duplicate email (409); invalid input (400)
- valid login, wrong password (401) and unknown email (same 401)
- missing or invalid token (401)
- creating a ticket, invalid ticket input (400), and an agent trying to create a ticket (403)
- customers only see their own tickets, even when they add extra query parameters
- a customer cannot read, edit or comment on another customer's ticket (403)
- an unknown ticket returns 404 and a non-numeric id returns 400
- an agent can update status and assign a ticket; assigning to a non-agent is rejected
- a customer cannot change status (403); delete follows the rules below
- agent-only endpoints (`/api/users`, `/api/tickets/stats`) return 403 to customers

### Postman

Import `postman/SupportTicketSystem.postman_collection.json`, set the `baseUrl` collection variable (e.g. `http://localhost:5000/api` or your deployed API URL), and run the whole collection with the **Collection Runner**. Login requests save their tokens into variables automatically.

There are 33 requests, each with assertions, covering:

- registration: success, invalid input and duplicate email
- login: success and invalid password
- creating, listing, filtering, fetching, updating and deleting tickets
- a request with no token (401)
- requests from the wrong role (403) and to another customer's ticket (403)
- invalid input (400) and a ticket that doesn't exist (404)
- comments and users

The collection needs the seed data, and it can also be run from the command line:

```bash
npx newman run postman/SupportTicketSystem.postman_collection.json --env-var baseUrl=http://localhost:5000/api
```

---

## API reference

All responses are JSON. Errors look like this:

```json
{ "message": "Validation failed", "errors": [{ "field": "subject", "message": "Subject must be 5-200 characters" }] }
```

| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Public | `{ name, email, password }` → `201 { token, user }` |
| POST | `/api/auth/login` | Public | `{ email, password }` → `200 { token, user }` / `401` |
| GET | `/api/auth/me` | Authenticated | Current user |
| GET | `/api/tickets` | Authenticated | Customers only get their own tickets. Query: `search`, `status`, `priority`, `assigned_to` (`me`, `unassigned` or an id), `sort` (`created_at`, `updated_at`, `priority`, `status`, `subject`), `order` (`asc`/`desc`) |
| GET | `/api/tickets/stats` | Agent | Dashboard counts |
| POST | `/api/tickets` | Customer | `{ subject, description, priority? }` → `201` |
| GET | `/api/tickets/:id` | Owner or agent | `400` bad id, `403` not yours, `404` not found |
| PUT | `/api/tickets/:id` | Agent / owner | Agents: `status`, `priority`, `assigned_to`. Owner: `subject`, `description`, `priority` while the ticket is open or in progress. Any other field returns `403` |
| DELETE | `/api/tickets/:id` | Agent / owner | `204`. See the delete policy below |
| GET | `/api/tickets/:id/comments` | Owner or agent | Oldest first, with author name and role |
| POST | `/api/tickets/:id/comments` | Owner or agent | `{ comment }` → `201` |
| GET | `/api/users` | Agent | Optional `?role=agent` (fills the "assign to" list) |

**Status codes used:** 200, 201, 204, 400 (validation or malformed JSON), 401 (not authenticated), 403 (authenticated but not allowed), 404, 409 (duplicate email), 500.

**Delete policy:** agents can delete any ticket (for spam or duplicates). A customer can delete (withdraw) their own ticket only while its status is `open`. After that, the ticket is part of the support record.

**Agent limits:** agents cannot create tickets, edit a customer's subject or description, assign tickets to non-agents, or create or promote users. New agent accounts are added by an administrator directly in the database (`npm run hash -- "<password>"` generates the hash).

---

## Database design

```
users (1) ──< tickets (many)          tickets.user_id     → users.id  ON DELETE CASCADE
users (1) ──< tickets (many)          tickets.assigned_to → users.id  ON DELETE SET NULL
tickets (1) ──< ticket_comments (many) ticket_comments.ticket_id → tickets.id ON DELETE CASCADE
users (1) ──< ticket_comments (many)   ticket_comments.user_id   → users.id
```

- `users(id, name, email UNIQUE, password_hash, role ENUM('customer','agent'), created_at)`
- `tickets(id, user_id, subject, description, priority ENUM, status ENUM, assigned_to NULL, created_at, updated_at ON UPDATE)`
- `ticket_comments(id, ticket_id, user_id, comment, created_at)`

**Indexes, and the query each one serves:**
- `uq_users_email`: the login lookup, which also enforces unique emails.
- `idx_tickets_user_created (user_id, created_at)`: a customer's dashboard, which filters by owner and sorts by date.
- `idx_tickets_status_created (status, created_at)`: the agent's status filter and the "open tickets" query.
- `idx_tickets_assigned_to` and `idx_tickets_priority`: the assignee and priority filters.
- `idx_comments_ticket_created (ticket_id, created_at)`: loads one ticket's conversation in order.

`ENUM` columns keep invalid statuses and priorities out of the database. `LIKE '%term%'` search is fine at this scale. For large data sets, a `FULLTEXT` index would be the next step.

**Section 8 example query:** all open tickets with the customer's name and email. It is in [`database/queries.sql`](database/queries.sql), along with other JOIN examples and an `EXPLAIN`:

```sql
SELECT t.id, t.subject, t.priority, t.status, t.created_at,
       u.name AS customer_name, u.email AS customer_email
FROM tickets t
INNER JOIN users u ON u.id = t.user_id
WHERE t.status = 'open'
ORDER BY t.created_at DESC;
```

`EXPLAIN` shows `ref` access on `idx_tickets_status_created` for `tickets` and `eq_ref` on the primary key for `users`, so neither table is fully scanned.

---

## Deployment

These instructions use free tiers: **Aiven** (MySQL), and **Render** for both the API and the static frontend. The app is plain Node + static files, so Railway, Vercel or Netlify work as well (`vercel.json` and `public/_redirects` are included).

### 1. MySQL on Aiven
1. Sign up at [aiven.io](https://aiven.io) and create a **MySQL** service on the free plan.
2. When it is running, open **Overview** and copy the **Service URI** (`mysql://avnadmin:...@host:port/defaultdb?ssl-mode=REQUIRED`). Download the **CA certificate** (`ca.pem`).
3. Load the schema and seed data. You can use the MySQL CLI:
   ```bash
   mysql --ssl-ca=ca.pem -h <host> -P <port> -u avnadmin -p defaultdb < database/schema.sql
   mysql --ssl-ca=ca.pem -h <host> -P <port> -u avnadmin -p defaultdb < database/seed.sql
   ```
   Or put `DATABASE_URL` (without the `?ssl-mode=...` part), `DB_SSL=true` and `DB_SSL_CA` in `backend/.env`, then run `npm run db:setup`.

### 2. Push to GitHub
```bash
git remote add origin https://github.com/<you>/support-ticket-system.git
git push -u origin main
```

### 3. API and frontend on Render (Blueprint)
1. In the [Render dashboard](https://dashboard.render.com), choose **New → Blueprint** and select the repository. Render reads `render.yaml` and creates two services, `support-ticket-api` and `support-ticket-web`.
2. Fill in the prompted values:
   - `DATABASE_URL`: the Aiven URI **without** `?ssl-mode=REQUIRED`
   - `DB_SSL_CA`: paste the contents of `ca.pem`
   - `CORS_ORIGIN`: the frontend URL, e.g. `https://support-ticket-web.onrender.com`
   - `VITE_API_URL`: the API URL plus `/api`, e.g. `https://support-ticket-api.onrender.com/api`

   Render generates `JWT_SECRET` automatically.
3. After the first deploy, check `https://<api>/api/health` → `{"status":"ok"}`. Then open the frontend URL and log in with a demo account.
4. If you change `VITE_API_URL` later, redeploy the frontend: Vite bakes the value in at build time.

> Free Render services sleep after about 15 minutes of inactivity, so the first request after that can take around 30 to 50 seconds.

### Deployment checklist
- [ ] The frontend loads at a public URL, and refreshing a deep link (e.g. `/tickets/1`) works
- [ ] `/api/health` returns ok
- [ ] Demo logins work for both roles
- [ ] CORS only allows the frontend origin
- [ ] No secrets in the repository (`git grep -i password` only shows the demo seed hash and docs)
