import type { TicketPriority, TicketStatus } from "@support-ticket-demo/shared";

const statusClass: Record<TicketStatus, string> = {
  OPEN: "bg-[#fff4e5] text-warn",
  IN_PROGRESS: "bg-[#eaf1ff] text-accent",
  RESOLVED: "bg-[#e8f6ef] text-success",
  CLOSED: "bg-[#eef0f3] text-muted"
};

const priorityClass: Record<TicketPriority, string> = {
  LOW: "bg-[#eef0f3] text-muted",
  MEDIUM: "bg-[#eaf1ff] text-accent",
  HIGH: "bg-[#fff4e5] text-warn",
  URGENT: "bg-[#fdecec] text-danger"
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${statusClass[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${priorityClass[priority]}`}
    >
      {priority}
    </span>
  );
}
