# Support Ticket Demo

Full-stack SaaS admin dashboard demo for support ticket operations. It is built to show the kind of practical maintenance and feature work common in Upwork contracts: JWT auth, role-based access, table filters, pagination, ticket CRUD, comments, status history, PostgreSQL modeling, Prisma queries, and REST API handoff docs.

## Current Status

First version target: complete local demo with usable API and usable pages.

- Admin can view all tickets, search/filter/sort/paginate, update status, change priority, assign an owner, comment, and view dashboard stats.
- User can register, log in, create tickets, view only their own tickets, and comment on their own tickets.
- Status changes write `ticket_status_history`.
- Setting a ticket to `RESOLVED` sets `resolvedAt` when empty.
- Reopening to `OPEN` or `IN_PROGRESS` clears `resolvedAt`.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT, bcrypt
- DevOps: Docker Compose

## Demo Accounts

```txt
Admin
email: admin@example.com
password: password123

User
email: user@example.com
password: password123
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run seed
npm run dev
```

Local URLs:

- Web: http://localhost:3000
- Web fallback when `3000` is busy: http://localhost:3001
- API: http://localhost:4000
- Health check: http://localhost:4000/health

LAN access:

- Open the web app from another device with the host machine IP, for example `http://192.168.1.5:3001`.
- The frontend rewrites a local API URL such as `http://localhost:4000/api` to the same LAN host, for example `http://192.168.1.5:4000/api`.
- The API allows CORS from localhost, private LAN IP origins, and Tailscale-style `100.64.0.0/10` origins for local demo use.

PostgreSQL must be running and reachable through `DATABASE_URL`. For a quick local database:

```bash
docker compose up -d postgres
```

## Docker Setup

```bash
docker compose up
```

The compose file starts PostgreSQL, runs Prisma generate/db push/seed, starts the Express API on port `4000`, and starts Next.js on port `3000`.

## Environment Variables

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/support_ticket_demo?schema=public
JWT_SECRET=replace-with-a-long-random-secret
PORT=4000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PATCH /api/tickets/:id`
- `PATCH /api/tickets/:id/status`
- `POST /api/tickets/:id/comments`
- `GET /api/admin/stats`
- `GET /api/admin/users`

See [docs/api.md](docs/api.md) for request and response details.

## Database Summary

Main tables:

- `users`
- `tickets`
- `comments`
- `ticket_status_history`

See [docs/database.md](docs/database.md) for model details and access rules.

## Screenshots / Demo URL

Current demo URL:

- Local web app: http://localhost:3000
- Local fallback used during verification when `3000` was already occupied: http://localhost:3001
- API health check: http://localhost:4000/health

The GitHub repository is private for now by request. A public hosted demo URL can be added after choosing a deployment target for the Next.js app, Express API, and PostgreSQL database.

Admin dashboard:

![Admin dashboard](output/playwright/admin-dashboard.png)

Ticket list with search/filtering:

![Ticket list with filters](output/playwright/ticket-list-filters.png)

Ticket detail with comments, status history, and admin controls:

![Ticket detail](output/playwright/ticket-detail.png)

## Known Tradeoffs

- This first version uses simple localStorage token handling to keep the demo fast to inspect.
- Docker Compose uses `prisma db push` for frictionless demo startup instead of committed production migrations.
- No file attachments, SLA timers, CSV export, or email notifications yet.
