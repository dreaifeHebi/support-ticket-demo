# Database Documentation

The schema is defined in [../prisma/schema.prisma](../prisma/schema.prisma).

## Tables

### users

- `id`
- `name`
- `email`
- `passwordHash`
- `role`: `USER | ADMIN`
- `createdAt`
- `updatedAt`

### tickets

- `id`
- `title`
- `description`
- `status`: `OPEN | IN_PROGRESS | RESOLVED | CLOSED`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`
- `category`
- `createdById`
- `assigneeId`
- `resolvedAt`
- `createdAt`
- `updatedAt`

### comments

- `id`
- `ticketId`
- `authorId`
- `body`
- `createdAt`

### ticket_status_history

- `id`
- `ticketId`
- `fromStatus`
- `toStatus`
- `changedById`
- `createdAt`

## Access Rules

- User ticket list queries always include `createdById = currentUser.id`.
- User ticket detail lookup only succeeds for the ticket owner.
- User comments only work on owned tickets.
- Admin ticket list queries do not include a `createdById` restriction.
- Admin endpoints are guarded by role middleware.

## Status Behavior

`PATCH /api/tickets/:id/status` is the only route that changes status. If the status changes, it writes `ticket_status_history`.

Resolution behavior:

- `RESOLVED`: set `resolvedAt` if it is currently empty.
- `OPEN` or `IN_PROGRESS`: clear `resolvedAt` when reopening.
- `CLOSED`: keep the existing `resolvedAt` value.
