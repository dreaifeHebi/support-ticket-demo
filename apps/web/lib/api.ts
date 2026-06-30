import type { Role, TicketPriority, TicketStatus } from "@support-ticket-demo/shared";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignee: User | null;
  _count?: { comments: number };
  comments?: Array<{ id: string; body: string; createdAt: string; author: User }>;
  history?: Array<{
    id: string;
    fromStatus: TicketStatus;
    toStatus: TicketStatus;
    createdAt: string;
    changedBy: User;
  }>;
};

export type PaginatedTickets = {
  data: Ticket[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminStats = {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  averageResolutionHours: number;
  ticketsByStatus: Array<{ status: TicketStatus; count: number }>;
  ticketsCreatedThisWeek: Array<{ date: string; count: number }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("support_ticket_token");
}

export function setSession(token: string, user: User) {
  window.localStorage.setItem("support_ticket_token", token);
  window.localStorage.setItem("support_ticket_user", JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem("support_ticket_token");
  window.localStorage.removeItem("support_ticket_user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("support_ticket_user");
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload as T;
}
