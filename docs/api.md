# API Documentation

Base URL:

```txt
http://localhost:4000/api
```

Authenticated endpoints require:

```txt
Authorization: Bearer <jwt>
```

## Auth

### POST /auth/register

Creates a normal `USER` account.

```json
{
  "name": "Client User",
  "email": "client@example.com",
  "password": "password123"
}
```

### POST /auth/login

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt",
  "user": {
    "id": "cuid",
    "name": "Admin Demo",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### GET /me

Returns the current authenticated user.

## Tickets

### GET /tickets

Admin sees all tickets. User only sees tickets where `createdById` is the current user.

Query parameters:

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

Response:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 42,
  "totalPages": 5
}
```

Allowed status values:

```txt
OPEN, IN_PROGRESS, RESOLVED, CLOSED
```

Allowed priority values:

```txt
LOW, MEDIUM, HIGH, URGENT
```

### POST /tickets

Creates a ticket for the current user.

```json
{
  "title": "Cannot log in",
  "description": "Password reset succeeds but login still fails.",
  "category": "Login",
  "priority": "HIGH",
  "assigneeId": "optional-admin-id"
}
```

Only admins can set `priority` and `assigneeId` on create. User-created tickets default to `MEDIUM` priority and no assignee.

### GET /tickets/:id

Returns ticket detail, comments, and status history. User can only access their own tickets.

### PATCH /tickets/:id

User can update their own `title`, `description`, and `category`.

Admin can also update:

```json
{
  "priority": "URGENT",
  "assigneeId": "admin-user-id-or-null"
}
```

### PATCH /tickets/:id/status

Admin only.

```json
{
  "status": "RESOLVED"
}
```

Behavior:

- A changed status creates a `ticket_status_history` record.
- Setting status to `RESOLVED` sets `resolvedAt` if it is empty.
- Reopening to `OPEN` or `IN_PROGRESS` clears `resolvedAt`.

### POST /tickets/:id/comments

Admin can comment on any ticket. User can comment on their own tickets.

```json
{
  "body": "I can reproduce this issue on Chrome."
}
```

## Admin

### GET /admin/stats

Admin only. Returns:

- `totalTickets`
- `openTickets`
- `resolvedTickets`
- `urgentTickets`
- `averageResolutionHours`
- `ticketsByStatus`
- `ticketsCreatedThisWeek`

### GET /admin/users

Admin only. Returns users with ticket counts for assignment/filter controls.
