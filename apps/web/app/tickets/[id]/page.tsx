"use client";

import { MessageSquare, Save, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ticketPriorities, ticketStatuses } from "@support-ticket-demo/shared";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PriorityBadge, StatusBadge } from "@/components/Badge";
import { apiFetch, type Ticket, type User } from "@/lib/api";

function TicketDetail({ user }: { user: User }) {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTicket() {
    const payload = await apiFetch<{ ticket: Ticket }>(`/tickets/${ticketId}`);
    setTicket(payload.ticket);
    setStatus(payload.ticket.status);
    setPriority(payload.ticket.priority);
    setAssigneeId(payload.ticket.assignee?.id ?? "");
  }

  useEffect(() => {
    setError("");
    loadTicket().catch((err) => setError(err instanceof Error ? err.message : "Failed to load ticket"));
    if (user.role === "ADMIN") {
      apiFetch<{ users: User[] }>("/admin/users")
        .then((payload) => setUsers(payload.users))
        .catch(() => setUsers([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, user.role]);

  async function saveAdminFields() {
    if (!ticket) return;
    setSaving(true);
    setError("");

    try {
      if (status !== ticket.status) {
        await apiFetch(`/tickets/${ticket.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status })
        });
      }

      await apiFetch(`/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ priority, assigneeId: assigneeId || null })
      });

      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ticket");
    } finally {
      setSaving(false);
    }
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    if (!ticket || !comment.trim()) return;
    setSaving(true);
    setError("");

    try {
      await apiFetch(`/tickets/${ticket.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment })
      });
      setComment("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSaving(false);
    }
  }

  const admins = users.filter((candidate) => candidate.role === "ADMIN");

  return (
    <AppShell user={user}>
      {error ? <div className="mb-4 rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}
      {!ticket ? (
        <div className="rounded-lg border border-line bg-white p-6 text-sm text-muted shadow-sm">Loading ticket...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold">{ticket.title}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="rounded bg-panel px-2 py-1 text-xs font-semibold text-muted">
                      {ticket.category}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-muted">
                  <div>Created {new Date(ticket.createdAt).toLocaleString()}</div>
                  <div>Updated {new Date(ticket.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6">{ticket.description}</p>
            </section>

            <section className="rounded-lg border border-line bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-line px-5 py-3 font-semibold">
                <MessageSquare size={18} />
                Comments
              </div>
              <div className="divide-y divide-line">
                {(ticket.comments ?? []).map((item) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">
                        {item.author.name}
                        <span className="ml-2 text-xs text-muted">{item.author.role}</span>
                      </div>
                      <div className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p>
                  </div>
                ))}
                {(ticket.comments ?? []).length === 0 ? (
                  <div className="px-5 py-8 text-sm text-muted">No comments yet.</div>
                ) : null}
              </div>
              <form onSubmit={addComment} className="border-t border-line p-5">
                <label className="block">
                  <span className="text-sm font-medium">Add comment</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="focus-ring mt-1 min-h-28 w-full rounded-md border border-line px-3 py-2"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving || !comment.trim()}
                  className="focus-ring mt-3 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Send size={16} />
                  Add comment
                </button>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Assignment</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Customer</dt>
                  <dd className="font-medium">{ticket.createdBy.name}</dd>
                  <dd className="text-muted">{ticket.createdBy.email}</dd>
                </div>
                <div>
                  <dt className="text-muted">Assignee</dt>
                  <dd className="font-medium">{ticket.assignee?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Resolved at</dt>
                  <dd className="font-medium">
                    {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "Not resolved"}
                  </dd>
                </div>
              </dl>
            </section>

            {user.role === "ADMIN" ? (
              <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold">Admin controls</h2>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm font-medium">Status</span>
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                    >
                      {ticketStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Priority</span>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value)}
                      className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                    >
                      {ticketPriorities.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Assignee</span>
                    <select
                      value={assigneeId}
                      onChange={(event) => setAssigneeId(event.target.value)}
                      className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={saveAdminFields}
                    disabled={saving}
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save size={16} />
                    Save changes
                  </button>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Status history</h2>
              <div className="space-y-4">
                {(ticket.history ?? []).map((item) => (
                  <div key={item.id} className="border-l-2 border-line pl-3 text-sm">
                    <div className="font-medium">
                      {item.fromStatus.replace("_", " ")} to {item.toStatus.replace("_", " ")}
                    </div>
                    <div className="text-muted">
                      {item.changedBy.name} · {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {(ticket.history ?? []).length === 0 ? (
                  <div className="text-sm text-muted">No status changes yet.</div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

export default function TicketDetailPage() {
  return <AuthGuard>{(user) => <TicketDetail user={user} />}</AuthGuard>;
}
