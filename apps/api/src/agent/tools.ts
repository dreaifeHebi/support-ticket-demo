import { Prisma, Role, TicketPriority, TicketStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import type { ChatAction } from "./model.js";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type ChatLink = {
  label: string;
  href: string;
};

type ToolResult = {
  reply: string;
  links: ChatLink[];
  action: ChatAction["action"];
  permission: "read" | "update" | "none";
};

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10).default(5),
  search: z.string().trim().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.string().trim().optional(),
  assigneeId: z.string().optional()
});

const ticketIdSchema = z.object({ ticketId: z.string().min(1) });
const createTicketSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(80)
});
const commentSchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1).max(3000)
});
const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.nativeEnum(TicketStatus)
});
const prioritySchema = z.object({
  ticketId: z.string().min(1),
  priority: z.nativeEnum(TicketPriority)
});
const assignSchema = z.object({
  ticketId: z.string().min(1),
  assigneeId: z.string().min(1)
});

const ticketInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } }
} satisfies Prisma.TicketInclude;

const ticketDetailInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, name: true, email: true, role: true } } }
  },
  history: {
    orderBy: { createdAt: "asc" as const },
    include: { changedBy: { select: { id: true, name: true, email: true } } }
  }
} satisfies Prisma.TicketInclude;

function ticketLink(ticket: { id: string; title: string }): ChatLink {
  return { label: ticket.title, href: `/tickets/${ticket.id}` };
}

async function findVisibleTicket(ticketId: string, user: AuthUser) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      ...(user.role === Role.USER ? { createdById: user.id } : {})
    },
    include: ticketDetailInclude
  });

  if (!ticket) {
    throw new HttpError(404, "Ticket not found or not visible to this user");
  }

  return ticket;
}

function requireAdmin(user: AuthUser) {
  if (user.role !== Role.ADMIN) {
    throw new HttpError(403, "This chatbot action requires Admin role");
  }
}

export async function executeChatAction(action: ChatAction, user: AuthUser): Promise<ToolResult> {
  switch (action.action) {
    case "list_tickets": {
      const params = listParamsSchema.parse(action.params);
      const where: Prisma.TicketWhereInput = {
        ...(user.role === Role.USER ? { createdById: user.id } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.priority ? { priority: params.priority } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.assigneeId && user.role === Role.ADMIN ? { assigneeId: params.assigneeId } : {}),
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { description: { contains: params.search, mode: "insensitive" } },
                { category: { contains: params.search, mode: "insensitive" } },
                { createdBy: { email: { contains: params.search, mode: "insensitive" } } }
              ]
            }
          : {})
      };

      const [total, tickets] = await prisma.$transaction([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          include: ticketInclude,
          orderBy: { createdAt: "desc" },
          skip: (params.page - 1) * params.limit,
          take: params.limit
        })
      ]);

      const links = tickets.map(ticketLink);
      const scope = user.role === Role.ADMIN ? "matching tickets" : "matching tickets you created";

      return {
        action: action.action,
        permission: "read",
        links,
        reply:
          total === 0
            ? `I could not find ${scope}.`
            : `I found ${total} ${scope}. Here are the first ${tickets.length} links.`
      };
    }

    case "get_ticket": {
      const params = ticketIdSchema.parse(action.params);
      const ticket = await findVisibleTicket(params.ticketId, user);
      return {
        action: action.action,
        permission: "read",
        links: [ticketLink(ticket)],
        reply: `${ticket.title} is ${ticket.status.replace("_", " ")} with ${ticket.priority} priority.`
      };
    }

    case "create_ticket": {
      const params = createTicketSchema.parse(action.params);
      const ticket = await prisma.ticket.create({
        data: {
          title: params.title,
          description: params.description,
          category: params.category,
          priority: TicketPriority.MEDIUM,
          createdById: user.id
        }
      });

      return {
        action: action.action,
        permission: "update",
        links: [ticketLink(ticket)],
        reply: "I created the ticket and linked it below."
      };
    }

    case "add_comment": {
      const params = commentSchema.parse(action.params);
      const ticket = await findVisibleTicket(params.ticketId, user);
      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          authorId: user.id,
          body: params.body
        }
      });

      return {
        action: action.action,
        permission: "update",
        links: [ticketLink(ticket)],
        reply: "I added the comment to the ticket."
      };
    }

    case "update_status": {
      requireAdmin(user);
      const params = statusSchema.parse(action.params);
      const current = await prisma.ticket.findUnique({ where: { id: params.ticketId } });

      if (!current) {
        throw new HttpError(404, "Ticket not found");
      }

      const shouldResolve =
        params.status === TicketStatus.RESOLVED && current.resolvedAt === null;
      const shouldClearResolvedAt =
        (params.status === TicketStatus.OPEN || params.status === TicketStatus.IN_PROGRESS) &&
        current.resolvedAt !== null;

      const ticket = await prisma.$transaction(async (tx) => {
        if (current.status !== params.status) {
          await tx.ticketStatusHistory.create({
            data: {
              ticketId: current.id,
              fromStatus: current.status,
              toStatus: params.status,
              changedById: user.id
            }
          });
        }

        return tx.ticket.update({
          where: { id: current.id },
          data: {
            status: params.status,
            ...(shouldResolve ? { resolvedAt: new Date() } : {}),
            ...(shouldClearResolvedAt ? { resolvedAt: null } : {})
          }
        });
      });

      return {
        action: action.action,
        permission: "update",
        links: [ticketLink(ticket)],
        reply: `I updated the ticket status to ${ticket.status.replace("_", " ")}.`
      };
    }

    case "update_priority": {
      requireAdmin(user);
      const params = prioritySchema.parse(action.params);
      const current = await prisma.ticket.findUnique({ where: { id: params.ticketId } });

      if (!current) {
        throw new HttpError(404, "Ticket not found");
      }

      const ticket = await prisma.ticket.update({
        where: { id: params.ticketId },
        data: { priority: params.priority }
      });

      return {
        action: action.action,
        permission: "update",
        links: [ticketLink(ticket)],
        reply: `I updated the ticket priority to ${ticket.priority}.`
      };
    }

    case "assign_ticket": {
      requireAdmin(user);
      const params = assignSchema.parse(action.params);
      const [current, assignee] = await Promise.all([
        prisma.ticket.findUnique({ where: { id: params.ticketId } }),
        prisma.user.findFirst({ where: { id: params.assigneeId, role: Role.ADMIN } })
      ]);

      if (!current) {
        throw new HttpError(404, "Ticket not found");
      }

      if (!assignee) {
        throw new HttpError(400, "Assignee must be an admin user");
      }

      const ticket = await prisma.ticket.update({
        where: { id: params.ticketId },
        data: { assigneeId: params.assigneeId }
      });

      return {
        action: action.action,
        permission: "update",
        links: [ticketLink(ticket)],
        reply: "I assigned the ticket and linked it below."
      };
    }

    case "unsupported":
    default:
      return {
        action: "unsupported",
        permission: "none",
        links: [],
        reply:
          action.reason ??
          "I can help read tickets, create tickets, add comments, and perform allowed admin updates. Delete actions are not available."
      };
  }
}
