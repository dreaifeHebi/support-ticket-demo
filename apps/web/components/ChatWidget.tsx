"use client";

import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { apiFetch, type User } from "@/lib/api";

type ChatLink = {
  label: string;
  href: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  links?: ChatLink[];
};

type ChatResponse = {
  reply: string;
  links: ChatLink[];
  action: string;
  permission: "read" | "update" | "none";
};

export function ChatWidget({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        user.role === "ADMIN"
          ? "Ask me to find tickets, add comments, or update ticket status, priority, and assignment."
          : "Ask me to find your tickets, create a ticket, or add a comment to your ticket."
    }
  ]);

  const requestMessages = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim())
        .slice(-8)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const payload = await apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...requestMessages, { role: "user", content }]
        })
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply,
          links: payload.links
        }
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat request failed";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: message
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <section className="flex h-[560px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-line bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eaf1ff] text-accent">
                <Bot size={18} />
              </span>
              <div>
                <div className="font-semibold">SupportOps Agent</div>
                <div className="text-xs text-muted">{user.role} permissions</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring rounded-md p-2 hover:bg-panel"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f8fa] p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-lg border px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto border-accent bg-accent text-white"
                    : "border-line bg-white text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap leading-5">{message.content}</p>
                {message.links && message.links.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {message.links.map((link) => (
                      <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        className="block rounded border border-line bg-panel px-2 py-1 text-xs font-medium text-accent hover:bg-white"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted">
                <Loader2 size={16} className="animate-spin" />
                Thinking
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="border-t border-line bg-white p-3">
            {error ? <div className="mb-2 text-xs text-danger">{error}</div> : null}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask about tickets or request an allowed action..."
                className="focus-ring max-h-28 min-h-11 flex-1 resize-none rounded-md border border-line px-3 py-2 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent text-white disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </section>
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
