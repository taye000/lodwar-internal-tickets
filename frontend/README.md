# Lodwar Internal Tickets

A small support ticket tracker. Create tickets, filter and page through them, change their status, and see counts by status.

**Stack:** Node.js + Express, PostgreSQL, React (Vite)

## Features

- Create tickets with a title, optional description, and priority
- List tickets with status and priority, newest first
- Filter by status and paginate the list
- Change a ticket's status inline
- Live counts of tickets per status

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 16 (installed locally) **or** Docker

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/lodwar-internal-tickets.git
cd lodwar-internal-tickets
```

### 2. Set up the database

**Option A: Docker**

From the repo root:

```bash
docker compose up -d
```

This starts Postgres on port 5432 and runs `backend/migrations/001_init.sql` automatically on first start. To also create the test database:

```bash
docker compose exec db createdb -U postgres tickets_test
docker compose exec -T db psql -U postgres -d tickets_test < backend/migrations/001_init.sql
```

**Option B: Local PostgreSQL**

```bash
createdb tickets
psql -d tickets -f backend/migrations/001_init.sql

createdb tickets_test
psql -d tickets_test -f backend/migrations/001_init.sql
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` so the connection strings match your database:

```
# Docker
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tickets
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/tickets_test

# Local Postgres on macOS (Homebrew) usually uses your system username, no password
DATABASE_URL=postgres://<your-username>@localhost:5432/tickets
TEST_DATABASE_URL=postgres://<your-username>@localhost:5432/tickets_test

PORT=4000
```

`frontend/.env` only needs the API URL, which defaults to `http://localhost:4000`.

### 4. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Running the app

Start each app in its own terminal:

```bash
# Terminal 1: API on http://localhost:4000
cd backend
npm run dev

# Terminal 2: UI on http://localhost:5173
cd frontend
npm run dev
```

Then open http://localhost:5173.

## Running the tests

```bash
cd backend
npm test
```

The tests are API integration tests using Node's built-in test runner and Supertest. They run against the `tickets_test` database (from `TEST_DATABASE_URL`) and empty the `tickets` table before each test, so they never touch development data. The test script uses `NODE_ENV=test`, which works on macOS and Linux; on Windows, use Git Bash or WSL.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/tickets` | Create a ticket. Body: `title` (required), `description`, `priority`, `status` |
| `GET` | `/tickets` | List tickets. Query: `status`, `page` (default 1), `limit` (default 10, max 100) |
| `PATCH` | `/tickets/:id` | Update `status` and/or `priority` |
| `GET` | `/tickets/stats` | Ticket counts by status, e.g. `{ "open": 2, "in_progress": 0, "closed": 1 }` |

Invalid input returns `400` with details about each failing field. Updating a ticket that doesn't exist returns `404`.

Example list response:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Printer not working",
      "description": null,
      "status": "open",
      "priority": "high",
      "created_at": "2026-10-10T09:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

## Project structure

```
backend/
  migrations/001_init.sql   Database schema
  src/
    app.js                  Express app, middleware, error handling
    server.js               Starts the server
    db.js                   Postgres connection pool
    validation.js           Request validation rules (express-validator)
    routes/tickets.js       Ticket endpoints
  tests/tickets.test.js     API integration tests
frontend/
  src/
    App.jsx                 Page layout, data loading, state
    api.js                  API client
    constants.js            Status and priority values and labels
    components/             StatsBar, TicketForm, TicketList
docker-compose.yml          Optional Postgres container
```

## Decisions & Tradeoffs

I used plain SQL through the `pg` library instead of an ORM, because with a single table the queries are short and an ORM would add setup without much benefit. The schema lives in one hand-written migration file rather than a migration tool, which is fine for one table but would not scale to a changing schema. Status and priority are stored as Postgres enums and also validated in the API with express-validator, so bad input gets a clear `400` instead of a database error. Pagination uses `LIMIT`/`OFFSET`, which is simple and fine at this scale but gets slower on large tables, where cursor-based pagination would be better. On the frontend, I refetch the list and stats after every change instead of using a caching library or optimistic updates, which keeps the code simple at the cost of an extra request. Authentication was left out because the spec doesn't require it, and CORS is open to all origins for local development. The tests cover the API end-to-end against a real test database, but there are no frontend tests. With more time, I would move to Prisma so schema changes are versioned and applied with Prisma Migrate, use SWR on the frontend for caching and optimistic updates, add frontend component tests and CI to run the tests on every push, and provide a Docker setup that runs the whole stack with one command.