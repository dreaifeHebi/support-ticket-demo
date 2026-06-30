"use client";

import { AlertCircle, CheckCircle2, Clock3, Flame, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PriorityBadge, StatusBadge } from "@/components/Badge";
import { apiFetch, type AdminStats, type PaginatedTickets, type Ticket, type User } from "@/lib/api";

function Metric({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">{label}</div>
        <div className="text-muted">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function AdminDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>("/admin/stats"),
      apiFetch<PaginatedTickets>("/tickets?limit=5&sort=createdAt&order=desc")
    ])
      .then(([statsPayload, ticketPayload]) => {
        setStats(statsPayload);
        setTickets(ticketPayload.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  return (
    <AppShell user={user}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operations dashboard</h1>
          <p className="text-sm text-muted">Live metrics from the support ticket database</p>
        </div>
        <Link
          href="/tickets"
          className="focus-ring rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          View tickets
        </Link>
      </div>

      {error ? <div className="mb-4 rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total Tickets" value={stats?.totalTickets ?? "..."} icon={<TicketIcon size={20} />} />
        <Metric label="Open Tickets" value={stats?.openTickets ?? "..."} icon={<AlertCircle size={20} />} />
        <Metric label="Resolved Tickets" value={stats?.resolvedTickets ?? "..."} icon={<CheckCircle2 size={20} />} />
        <Metric label="Urgent Tickets" value={stats?.urgentTickets ?? "..."} icon={<Flame size={20} />} />
        <Metric
          label="Avg Resolution"
          value={stats ? `${stats.averageResolutionHours}h` : "..."}
          icon={<Clock3 size={20} />}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">Tickets by status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.ticketsByStatus ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="mb-4 font-semibold">Tickets created this week</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.ticketsCreatedThisWeek ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#13845b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3 font-semibold">Recent tickets</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-panel text-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${ticket.id}`} className="font-medium text-accent">
                      {ticket.title}
                    </Link>
                    <div className="text-xs text-muted">{ticket.category}</div>
                  </td>
                  <td className="px-4 py-3">{ticket.createdBy.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">{ticket.assignee?.name ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function UserDashboard({ user }: { user: User }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<PaginatedTickets>("/tickets?limit=8&sort=createdAt&order=desc")
      .then((payload) => setTickets(payload.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"));
  }, []);

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;

  return (
    <AppShell user={user}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My support tickets</h1>
          <p className="text-sm text-muted">Create tickets and follow replies from support staff</p>
        </div>
        <Link
          href="/tickets/new"
          className="focus-ring rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Create ticket
        </Link>
      </div>
      {error ? <div className="mb-4 rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="My Tickets" value={tickets.length} icon={<TicketIcon size={20} />} />
        <Metric label="Open" value={openCount} icon={<AlertCircle size={20} />} />
        <Metric
          label="Resolved"
          value={tickets.filter((ticket) => ticket.status === "RESOLVED").length}
          icon={<CheckCircle2 size={20} />}
        />
      </div>
      <section className="mt-6 rounded-lg border border-line bg-white shadow-sm">
        <div className="border-b border-line px-4 py-3 font-semibold">Latest tickets</div>
        <div className="divide-y divide-line">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block px-4 py-4 hover:bg-panel">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{ticket.title}</span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="mt-1 text-sm text-muted">{ticket.category}</div>
            </Link>
          ))}
          {tickets.length === 0 ? <div className="px-4 py-8 text-sm text-muted">No tickets yet.</div> : null}
        </div>
      </section>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => (user.role === "ADMIN" ? <AdminDashboard user={user} /> : <UserDashboard user={user} />)}
    </AuthGuard>
  );
}
