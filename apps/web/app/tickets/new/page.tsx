"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ticketCategories, ticketPriorities } from "@support-ticket-demo/shared";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { apiFetch, type Ticket, type User } from "@/lib/api";

function CreateTicket({ user }: { user: User }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.role === "ADMIN") {
      apiFetch<{ users: User[] }>("/admin/users")
        .then((payload) => setUsers(payload.users))
        .catch(() => setUsers([]));
    }
  }, [user.role]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = await apiFetch<{ ticket: Ticket }>("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          assigneeId: assigneeId || null
        })
      });
      router.replace(`/tickets/${payload.ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  const admins = users.filter((candidate) => candidate.role === "ADMIN");

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create ticket</h1>
        <p className="text-sm text-muted">Submit a support request with category and priority metadata</p>
      </div>

      <form onSubmit={submit} className="max-w-3xl rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
              required
              minLength={3}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="focus-ring mt-1 min-h-40 w-full rounded-md border border-line px-3 py-2"
              required
              minLength={10}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
              >
                {ticketCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                disabled={user.role !== "ADMIN"}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 disabled:bg-panel"
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
                disabled={user.role !== "ADMIN"}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 disabled:bg-panel"
              >
                <option value="">Unassigned</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <div className="rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Send size={18} />
            {loading ? "Creating..." : "Create ticket"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

export default function NewTicketPage() {
  return <AuthGuard>{(user) => <CreateTicket user={user} />}</AuthGuard>;
}
