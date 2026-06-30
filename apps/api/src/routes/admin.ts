import { Role, TicketPriority, TicketStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../errors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole(Role.ADMIN));

router.get(
  "/admin/users",
  asyncHandler(async (_request, response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { createdTickets: true, assignedTickets: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    response.json({ users });
  })
);

router.get(
  "/admin/stats",
  asyncHandler(async (_request, response) => {
    const [totalTickets, openTickets, resolvedTickets, urgentTickets] = await prisma.$transaction([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
        prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
        prisma.ticket.count({ where: { priority: TicketPriority.URGENT } })
      ]);
    const byStatus = await prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" }
    });
    const tickets = await prisma.ticket.findMany({
      select: { createdAt: true, resolvedAt: true },
      orderBy: { createdAt: "desc" }
    });

    const resolvedDurations = tickets
      .filter((ticket) => ticket.resolvedAt)
      .map((ticket) => ticket.resolvedAt!.getTime() - ticket.createdAt.getTime());

    const averageResolutionHours =
      resolvedDurations.length === 0
        ? 0
        : resolvedDurations.reduce((sum, value) => sum + value, 0) /
          resolvedDurations.length /
          1000 /
          60 /
          60;

    const lastSevenDays = Array.from({ length: 7 }).map((_, offset) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - offset));
      const day = date.toISOString().slice(0, 10);

      return {
        date: day,
        count: tickets.filter((ticket) => ticket.createdAt.toISOString().slice(0, 10) === day)
          .length
      };
    });

    response.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      urgentTickets,
      averageResolutionHours: Number(averageResolutionHours.toFixed(1)),
      ticketsByStatus: byStatus.map((entry) => ({
        status: entry.status,
        count: entry._count._all
      })),
      ticketsCreatedThisWeek: lastSevenDays
    });
  })
);

export default router;
