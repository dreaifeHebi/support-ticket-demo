"use client";

import { ExternalLink, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { User } from "@/lib/api";
import { ChatPanel } from "./ChatPanel";

export function ChatWidget({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <div className="w-[min(420px,calc(100vw-2rem))]">
          <ChatPanel
            user={user}
            headerAction={
              <>
                <Link
                  href="/chat"
                  className="focus-ring rounded-md p-2 text-muted hover:bg-panel"
                  aria-label="Open full chat page"
                  title="Open full chat page"
                  onClick={() => setOpen(false)}
                >
                  <ExternalLink size={17} />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="focus-ring rounded-md p-2 text-muted hover:bg-panel"
                  aria-label="Close chatbot"
                >
                  <X size={18} />
                </button>
              </>
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-[#1d4ed8]"
          aria-label="Open chatbot"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
