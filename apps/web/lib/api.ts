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

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function resolveApiUrl() {
  if (typeof window === "undefined") {
    return configuredApiUrl;
  }

  const apiUrl = new URL(configuredApiUrl);
  const pageHost = window.location.hostname;
  const apiHostIsLocal = apiUrl.hostname === "localhost" || apiUrl.hostname === "127.0.0.1";
  const pageHostIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";

  if (apiHostIsLocal && !pageHostIsLocal) {
    apiUrl.hostname = pageHost;
  }

  return apiUrl.toString().replace(/\/$/, "");
}

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
  const response = await fetch(`${resolveApiUrl()}${path}`, {
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
