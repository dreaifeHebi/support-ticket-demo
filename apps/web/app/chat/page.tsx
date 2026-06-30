"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  return (
    <AuthGuard>
      {(user) => (
        <AppShell user={user}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Agent chat</h1>
            <p className="text-sm text-muted">
              Ask authenticated questions about tickets, or request allowed updates with role checks.
            </p>
          </div>
          <ChatPanel user={user} fullHeight />
        </AppShell>
      )}
    </AuthGuard>
  );
}
