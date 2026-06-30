import { Prisma, Role, TicketPriority, TicketStatus } from "@prisma/client";
import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
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

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.string().trim().optional(),
  assigneeId: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt", "title", "status", "priority"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc")
});

const createTicketSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(80),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().optional().nullable()
});

const updateTicketSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.string().min(2).max(80).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().nullable().optional()
});

const statusSchema = z.object({
  status: z.nativeEnum(TicketStatus)
});

const commentSchema = z.object({
  body: z.string().min(1).max(3000)
});

function assertUser(request: Request) {
  if (!request.user) {
    throw new HttpError(401, "Authentication required");
  }
  return request.user;
}

function getTicketId(request: Request) {
  const { id } = request.params;
  if (typeof id !== "string") {
    throw new HttpError(400, "Invalid ticket id");
  }
  return id;
}

async function findVisibleTicket(ticketId: string, user: Request["user"]) {
  if (!user) {
    throw new HttpError(401, "Authentication required");
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      ...(user.role === Role.USER ? { createdById: user.id } : {})
    },
    include: ticketDetailInclude
  });

  if (!ticket) {
    throw new HttpError(404, "Ticket not found");
  }

  return ticket;
}

router.use(requireAuth);

router.get(
  "/tickets",
  asyncHandler(async (request, response) => {
    const user = assertUser(request);
    const query = listSchema.parse(request.query);
    const where: Prisma.TicketWhereInput = {
      ...(user.role === Role.USER ? { createdById: user.id } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.assigneeId && user.role === Role.ADMIN ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { category: { contains: query.search, mode: "insensitive" } },
              { createdBy: { email: { contains: query.search, mode: "insensitive" } } }
            ]
          }
        : {})
    };

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: ticketInclude,
        orderBy: { [query.sort]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      })
    ]);

    response.json({
      data: tickets,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    });
  })
);

router.post(
  "/tickets",
  asyncHandler(async (request, response) => {
    const user = assertUser(request);
    const input = createTicketSchema.parse(request.body);
    const ticket = await prisma.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: user.role === Role.ADMIN && input.priority ? input.priority : TicketPriority.MEDIUM,
        assigneeId: user.role === Role.ADMIN ? input.assigneeId ?? null : null,
        createdById: user.id
      },
      include: ticketDetailInclude
    });

    response.status(201).json({ ticket });
  })
);

router.get(
  "/tickets/:id",
  asyncHandler(async (request, response) => {
    const ticket = await findVisibleTicket(getTicketId(request), request.user);
    response.json({ ticket });
  })
);

router.patch(
  "/tickets/:id",
  asyncHandler(async (request, response) => {
    const user = assertUser(request);
    const input = updateTicketSchema.parse(request.body);
    const ticketId = getTicketId(request);
    await findVisibleTicket(ticketId, request.user);

    const userAllowedData: Prisma.TicketUpdateInput = {
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.category ? { category: input.category } : {})
    };

    const adminAllowedData: Prisma.TicketUpdateInput = {
      ...userAllowedData,
      ...(input.priority ? { priority: input.priority } : {}),
      ...(Object.prototype.hasOwnProperty.call(input, "assigneeId")
        ? { assignee: input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true } }
        : {})
    };

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: user.role === Role.ADMIN ? adminAllowedData : userAllowedData,
      include: ticketDetailInclude
    });

    response.json({ ticket });
  })
);

router.patch(
  "/tickets/:id/status",
  asyncHandler(async (request, response) => {
    const user = assertUser(request);

    if (user.role !== Role.ADMIN) {
      throw new HttpError(403, "Only admins can change ticket status");
    }

    const input = statusSchema.parse(request.body);
    const current = await prisma.ticket.findUnique({ where: { id: getTicketId(request) } });

    if (!current) {
      throw new HttpError(404, "Ticket not found");
    }

    const shouldResolve =
      input.status === TicketStatus.RESOLVED && current.resolvedAt === null;
    const shouldClearResolvedAt =
      (input.status === TicketStatus.OPEN || input.status === TicketStatus.IN_PROGRESS) &&
      current.resolvedAt !== null;

    const ticket = await prisma.$transaction(async (tx) => {
      if (current.status !== input.status) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: current.id,
            fromStatus: current.status,
            toStatus: input.status,
            changedById: user.id
          }
        });
      }

      return tx.ticket.update({
        where: { id: current.id },
        data: {
          status: input.status,
          ...(shouldResolve ? { resolvedAt: new Date() } : {}),
          ...(shouldClearResolvedAt ? { resolvedAt: null } : {})
        },
        include: ticketDetailInclude
      });
    });

    response.json({ ticket });
  })
);

router.post(
  "/tickets/:id/comments",
  asyncHandler(async (request, response) => {
    const user = assertUser(request);
    const input = commentSchema.parse(request.body);
    const ticketId = getTicketId(request);
    await findVisibleTicket(ticketId, request.user);

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: user.id,
        body: input.body
      },
      include: { author: { select: { id: true, name: true, email: true, role: true } } }
    });

    response.status(201).json({ comment });
  })
);

export default router;
