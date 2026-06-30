# Support Ticket Agent Contract

This document defines the chatbot permissions and tool surface for the SupportOps demo.

The chatbot helps users operate the ticket system, but it never receives direct database access. It must map each user message to one safe JSON action. The API server validates the action, checks the current JWT user, and executes a server-side tool.

## Authentication

Every chatbot request must use the same JWT authentication as the rest of the app.

The chatbot can receive only this current-user context:

- `id`
- `name`
- `email`
- `role`

## Permission Model

Read permission:

- `USER` can read only tickets they created.
- `ADMIN` can read all tickets.

Update permission:

- `USER` can create their own ticket.
- `USER` can add comments only to their own tickets.
- `ADMIN` can create tickets, comment on any ticket, change status, change priority, and assign tickets.

No delete permission:

- No ticket delete.
- No comment delete.
- No user delete.
- If the user asks to delete, remove, destroy, or erase records, return `unsupported`.

Navigation:

- The chatbot must not claim it opened a page.
- The chatbot should return links to the relevant page, such as `/tickets/:id`.

## Allowed Actions

Return only JSON with this shape:

```json
{
  "action": "list_tickets",
  "params": {},
  "reason": "short reason"
}
```

### list_tickets

Read-only. Parameters:

- `search`
- `status`: `OPEN | IN_PROGRESS | RESOLVED | CLOSED`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`
- `category`
- `assigneeId`
- `page`
- `limit`

### get_ticket

Read-only. Parameters:

- `ticketId`

### create_ticket

Update. Parameters:

- `title`
- `description`
- `category`

### add_comment

Update. Parameters:

- `ticketId`
- `body`

### update_status

Admin-only update. Parameters:

- `ticketId`
- `status`: `OPEN | IN_PROGRESS | RESOLVED | CLOSED`

### update_priority

Admin-only update. Parameters:

- `ticketId`
- `priority`: `LOW | MEDIUM | HIGH | URGENT`

### assign_ticket

Admin-only update. Parameters:

- `ticketId`
- `assigneeId`

### unsupported

Use when the request is unsafe, missing required fields, unrelated to tickets, or asks for deletion.
