# AGENTS.md

## Project Goal

Build a portfolio-ready SaaS Admin Dashboard / Support Ticket System demo for Upwork client work.

The demo should prove practical full-stack skills, especially:

- React/Next.js admin UI
- REST API design
- PostgreSQL relational modeling
- Prisma queries with filtering, sorting, and pagination
- JWT authentication
- Role-based access control for User and Admin
- Docker Compose local startup
- Clear README and API handoff docs

This is not a toy landing page. Build the actual usable ticket operations dashboard as the first screen after login.

## Product Positioning

Present this project as:

> Full-stack SaaS admin dashboard demo with JWT auth, role-based access, ticket CRUD, filters, pagination, comments, status history, PostgreSQL schema, REST API docs, Docker setup, and deployment-ready README.

The main Upwork signal is that the developer can handle common small contracts:

- Fix dashboard bugs
- Add table filters
- Fix pagination
- Add search to existing tables
- Build CRUD admin dashboards
- Connect frontend tables to backend APIs
- Add fields or status transitions
- Improve API handoff documentation

## Recommended Tech Stack

Use this first-version stack unless there is a strong reason to change it:

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT, bcrypt
- Charts: Recharts
- DevOps: Docker, Docker Compose

Prefer Express over NestJS for the first version. Express is faster to build and maps well to many Upwork maintenance tasks.

## Suggested Repository Shape

Use a monorepo-style layout:

```txt
support-ticket-demo/
  apps/
    web/        Next.js frontend
    api/        Express backend
  packages/
    shared/     shared types, constants, enums
  prisma/
    schema.prisma
    seed.ts
  docs/
    api.md
    database.md
  docker-compose.yml
  README.md
  .env.example
```

If starting quickly, it is acceptable to keep Prisma under `apps/api/prisma/`, but document the choice clearly.

## Roles

There are two roles:

- User
- Admin

User can:

- Register
- Log in
- Create tickets
- View their own tickets
- Add comments to their own tickets

Admin can:

- View all tickets
- Search and filter tickets
- Update ticket status
- Change priority
- Assign an owner
- Reply in comments
- View dashboard statistics

## Core Pages

Build these pages first:

- Login page
- Register page
- Dashboard home
- Ticket list page
- Ticket detail page
- Create ticket page

Admin dashboard should show operational data. User dashboard can be simpler and focused on "my tickets".

## Ticket Fields

Ticket fields:

- id
- title
- description
- status
- priority
- category
- assignee
- createdBy
- createdAt
- updatedAt
- resolvedAt

Statuses:

- Open
- In Progress
- Resolved
- Closed

Priorities:

- Low
- Medium
- High
- Urgent

## Database Model

Use at least these tables:

```txt
users
- id
- name
- email
- passwordHash
- role: USER | ADMIN
- createdAt
- updatedAt

tickets
- id
- title
- description
- status: OPEN | IN_PROGRESS | RESOLVED | CLOSED
- priority: LOW | MEDIUM | HIGH | URGENT
- category
- createdById
- assigneeId
- resolvedAt
- createdAt
- updatedAt

comments
- id
- ticketId
- authorId
- body
- createdAt

ticket_status_history
- id
- ticketId
- fromStatus
- toStatus
- changedById
- createdAt
```

Important implementation details:

- User ticket list must only return tickets created by that user.
- Admin ticket list must return all tickets.
- Status changes should create a `ticket_status_history` record.
- Setting status to `RESOLVED` should set `resolvedAt` if it is empty.
- Reopening a ticket may clear `resolvedAt`, but document the chosen behavior.

## API Scope

Document these endpoints in `README.md` or `docs/api.md`:

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/me

GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/status
POST   /api/tickets/:id/comments

GET    /api/admin/stats
GET    /api/admin/users
```

`GET /api/tickets` is the most important demo endpoint. It must support:

```txt
?page=1
&limit=10
&search=login
&status=OPEN
&priority=HIGH
&category=Billing
&assigneeId=...
&sort=createdAt
&order=desc
```

Return a paginated response:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPages": 5
}
```

## Dashboard Metrics

Admin dashboard cards:

- Total Tickets
- Open Tickets
- Resolved Tickets
- Urgent Tickets
- Average Resolution Time

Charts:

- Tickets by Status
- Tickets Created This Week

Keep charts simple. The main value is proving the API and data flow.

## UX Requirements

Build a dense, practical SaaS admin interface rather than a marketing landing page.

Expected UI behavior:

- Login page has demo account shortcuts.
- Ticket table supports search, filters, sort, and pagination.
- Empty states are clear.
- Loading states do not shift layout heavily.
- Admin-only controls are hidden from User role.
- Forms show validation errors.
- Detail page shows comments and status history.

Avoid decorative hero sections. The first useful screen after login should be the dashboard or ticket list.

## Demo Accounts

Seed these accounts:

```txt
Admin
email: admin@example.com
password: password123

User
email: user@example.com
password: password123
```

Seed enough sample tickets to make pagination, search, filters, and charts visible.

Recommended seed volume:

- 2 admin users
- 5 normal users
- 40 to 80 tickets
- Multiple categories
- Mixed status and priority values
- Several comments per representative ticket
- Status history on at least 10 tickets

## Implementation Order

1. Create repo skeleton and package scripts.
2. Add Prisma schema and seed data.
3. Build Express API with health check.
4. Add auth: register, login, JWT middleware, current user route.
5. Add RBAC middleware.
6. Implement ticket CRUD and list query with pagination/search/filter/sort.
7. Implement comments.
8. Implement status changes and status history.
9. Implement admin stats.
10. Build frontend auth flow.
11. Build dashboard layout and navigation.
12. Build ticket list table.
13. Build ticket create form.
14. Build ticket detail page.
15. Add Docker Compose.
16. Write README, API docs, and env example.
17. Deploy and record a short demo video.

## Quality Bar

Before calling the demo complete:

- `npm run lint` passes where configured.
- Backend validation rejects invalid status and priority values.
- User cannot access another user's ticket.
- User cannot call admin-only endpoints.
- Admin can filter all tickets.
- Pagination returns correct `total` and `totalPages`.
- Docker Compose starts PostgreSQL and the API cleanly.
- README includes local and Docker startup.

## README Must Include

The final README should include:

- Short project description
- Screenshots or GIF
- Online demo URL
- Demo login accounts
- Tech stack
- Local setup
- Docker setup
- Environment variables
- Main API endpoints
- Database schema summary
- Design tradeoffs

README rules:

- README is public-facing. Write it for visitors (potential clients and developers): what the project is, the live demo, demo accounts, screenshots, features, and setup.
- Do not put progress, status, version targets ("first version", "V2"), verification notes, or local troubleshooting history in README. Record progress and status in `docs/` (for example `docs/progress.md`) instead.
- Keep long reference material in `docs/` (`api.md`, `database.md`, `agent.md`, `local-development.md`) and link it from README.
- README screenshots live in `docs/images/`. Do not link to test output such as `output/playwright/`.

## Nice-to-Have V2 Features

Only add these after the core demo works:

- File attachments
- SLA due dates
- CSV export
- Email notification mock
- Audit log
- Dark mode
- Swagger/OpenAPI UI
- Playwright end-to-end tests
- GitHub Actions CI

## Working Notes For Future Codex Sessions

When continuing this project:

- Prefer finishing a thin end-to-end slice before expanding features.
- Keep the demo focused on Upwork client relevance.
- Do not build a landing page before the functional dashboard.
- Keep status, priority, and role enums shared between frontend and backend.
- Make table filtering and pagination robust, since this is the strongest portfolio signal.
- Keep README's public-facing content (features, setup, API overview) accurate as the implementation changes. Record work-in-progress status in `docs/`, not README.
