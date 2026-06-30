import { PrismaClient, Role, TicketPriority, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = ["Billing", "Login", "Technical", "Account", "Feature Request", "Other"];
const statuses = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED
];
const priorities = [
  TicketPriority.LOW,
  TicketPriority.MEDIUM,
  TicketPriority.HIGH,
  TicketPriority.URGENT
];

const ticketTitles = [
  "Cannot log in after password reset",
  "Invoice shows duplicate charge",
  "Need help changing account owner",
  "Webhook delivery is delayed",
  "Dashboard table search is not matching emails",
  "Exported CSV misses the status column",
  "Two-factor code expires too quickly",
  "Billing address update fails",
  "Feature request for saved filters",
  "API token screen returns a 500 error"
];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: { name: "Admin Demo", email: "admin@example.com", passwordHash, role: Role.ADMIN }
    }),
    prisma.user.create({
      data: { name: "Ops Admin", email: "ops@example.com", passwordHash, role: Role.ADMIN }
    }),
    prisma.user.create({
      data: { name: "User Demo", email: "user@example.com", passwordHash, role: Role.USER }
    }),
    prisma.user.create({
      data: { name: "Mia Chen", email: "mia@example.com", passwordHash, role: Role.USER }
    }),
    prisma.user.create({
      data: { name: "Leo Patel", email: "leo@example.com", passwordHash, role: Role.USER }
    }),
    prisma.user.create({
      data: { name: "Nora Smith", email: "nora@example.com", passwordHash, role: Role.USER }
    }),
    prisma.user.create({
      data: { name: "Evan Lee", email: "evan@example.com", passwordHash, role: Role.USER }
    })
  ]);

  const admins = users.filter((user) => user.role === Role.ADMIN);
  const customers = users.filter((user) => user.role === Role.USER);

  for (let index = 0; index < 56; index += 1) {
    const status = statuses[index % statuses.length];
    const priority = priorities[(index + 1) % priorities.length];
    const createdBy = customers[index % customers.length];
    const assignee = admins[index % admins.length];
    const createdAt = daysAgo(55 - index);
    const resolvedAt =
      status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED
        ? daysAgo(Math.max(0, 53 - index))
        : null;

    const ticket = await prisma.ticket.create({
      data: {
        title: `${ticketTitles[index % ticketTitles.length]} #${index + 1}`,
        description:
          "Sample support request seeded for demonstrating CRUD operations, filtering, pagination, comments, and status tracking.",
        category: categories[index % categories.length],
        status,
        priority,
        createdById: createdBy.id,
        assigneeId: index % 3 === 0 ? null : assignee.id,
        createdAt,
        updatedAt: daysAgo(Math.max(0, 54 - index)),
        resolvedAt
      }
    });

    if (index < 18) {
      await prisma.comment.createMany({
        data: [
          {
            ticketId: ticket.id,
            authorId: createdBy.id,
            body: "I can reproduce this issue in my workspace."
          },
          {
            ticketId: ticket.id,
            authorId: assignee.id,
            body: "Thanks, I am checking the account details and recent logs."
          }
        ]
      });
    }

    if (index < 16) {
      const firstTransition =
        status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : status;

      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: TicketStatus.OPEN,
          toStatus: firstTransition,
          changedById: assignee.id,
          createdAt: daysAgo(Math.max(0, 54 - index))
        }
      });

      if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
        await prisma.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: TicketStatus.IN_PROGRESS,
            toStatus: status,
            changedById: assignee.id,
            createdAt: daysAgo(Math.max(0, 52 - index))
          }
        });
      }
    }
  }

  console.log("Seed complete: admin@example.com / user@example.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
