"use client";

import { BarChart3, Bot, LogOut, PlusCircle, Ticket } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearSession, getStoredUser, type User } from "@/lib/api";
import { ChatWidget } from "./ChatWidget";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/tickets/new", label: "New Ticket", icon: PlusCircle },
  { href: "/chat", label: "Agent Chat", icon: Bot }
];

export function AppShell({ children, user }: { children: ReactNode; user?: User | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = user ?? getStoredUser();
  const showChatWidget = Boolean(currentUser && pathname !== "/chat");

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-line bg-white px-4 py-5 md:block">
        <div className="mb-8">
          <div className="text-lg font-semibold">SupportOps</div>
          <div className="text-sm text-muted">Ticket operations demo</div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-[#eaf1ff] text-accent" : "text-ink hover:bg-panel"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-4 md:px-8">
          <div>
            <div className="text-sm text-muted">{currentUser?.role ?? "USER"}</div>
            <div className="font-semibold">{currentUser?.name ?? "Demo user"}</div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm hover:bg-panel"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      {showChatWidget && currentUser ? <ChatWidget user={currentUser} /> : null}
    </div>
  );
}
