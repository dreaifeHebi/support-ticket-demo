"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ticketPriorities, ticketStatuses } from "@support-ticket-demo/shared";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PriorityBadge, StatusBadge } from "@/components/Badge";
import { apiFetch, type PaginatedTickets, type Ticket, type User } from "@/lib/api";

type Filters = {
  page: number;
  limit: number;
  search: string;
  status: string;
  priority: string;
  category: string;
  assigneeId: string;
  sort: string;
  order: string;
};

const initialFilters: Filters = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  priority: "",
  category: "",
  assigneeId: "",
  sort: "createdAt",
  order: "desc"
};

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined) {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function TicketList({ user }: { user: User }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [payload, setPayload] = useState<PaginatedTickets | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetch<PaginatedTickets>(`/tickets?${query}`)
      .then(setPayload)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (user.role === "ADMIN") {
      apiFetch<{ users: User[] }>("/admin/users")
        .then((result) => setUsers(result.users))
        .catch(() => setUsers([]));
    }
  }, [user.role]);

  function updateFilter(key: keyof Filters, value: string | number) {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }));
  }

  const tickets = payload?.data ?? [];
  const adminUsers = users.filter((candidate) => candidate.role === "ADMIN");

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tickets</h1>
          <p className="text-sm text-muted">
            {user.role === "ADMIN" ? "All customer tickets" : "Tickets created by your account"}
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="focus-ring rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          New ticket
        </Link>
      </div>

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={18} />
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search title, description, customer..."
              className="focus-ring w-full rounded-md border border-line py-2 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">All status</option>
            {ticketStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">All priority</option>
            {ticketPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <input
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            placeholder="Category"
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <select
            value={filters.assigneeId}
            disabled={user.role !== "ADMIN"}
            onChange={(event) => updateFilter("assigneeId", event.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm disabled:bg-panel"
          >
            <option value="">All assignees</option>
            {adminUsers.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
          <select
            value={filters.order}
            onChange={(event) => updateFilter("order", event.target.value)}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </section>

      {error ? <div className="mt-4 rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}

      <section className="mt-4 rounded-lg border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
          <span className="font-semibold">
            {payload ? `${payload.total} tickets` : loading ? "Loading tickets" : "Tickets"}
          </span>
          <span className="text-muted">
            Page {payload?.page ?? filters.page} of {payload?.totalPages ?? 1}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-panel text-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Comments</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: Ticket) => (
                <tr key={ticket.id} className="border-t border-line hover:bg-panel">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${ticket.id}`} className="font-medium text-accent">
                      {ticket.title}
                    </Link>
                    <div className="line-clamp-1 max-w-[300px] text-xs text-muted">
                      {ticket.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">{ticket.createdBy.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">{ticket.category}</td>
                  <td className="px-4 py-3">{ticket.assignee?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{ticket._count?.comments ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && tickets.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted">No tickets match these filters.</div>
        ) : null}

        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <button
            type="button"
            disabled={(payload?.page ?? 1) <= 1}
            onClick={() => updateFilter("page", Math.max(1, filters.page - 1))}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            type="button"
            disabled={(payload?.page ?? 1) >= (payload?.totalPages ?? 1)}
            onClick={() => updateFilter("page", filters.page + 1)}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </AppShell>
  );
}

export default function TicketsPage() {
  return <AuthGuard>{(user) => <TicketList user={user} />}</AuthGuard>;
}
