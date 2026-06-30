"use client";

import { Bot, Eraser, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { usePersistentChat } from "@/lib/chat";
import type { User } from "@/lib/api";

export function ChatPanel({
  user,
  headerAction,
  fullHeight = false
}: {
  user: User;
  headerAction?: ReactNode;
  fullHeight?: boolean;
}) {
  const { messages, input, setInput, loading, error, sendMessage, clearMessages } =
    usePersistentChat(user);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm ${
        fullHeight ? "h-[calc(100vh-8rem)] min-h-[620px]" : "h-[560px]"
      }`}
    >
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eaf1ff] text-accent">
            <Bot size={18} />
          </span>
          <div>
            <div className="font-semibold">SupportOps Agent</div>
            <div className="text-xs text-muted">{user.role} permissions · history saved locally</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearMessages}
            className="focus-ring rounded-md p-2 text-muted hover:bg-panel"
            aria-label="Clear chat history"
            title="Clear chat history"
          >
            <Eraser size={17} />
          </button>
          {headerAction}
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f8fa] p-4">
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
            className="focus-ring max-h-32 min-h-11 flex-1 resize-none rounded-md border border-line px-3 py-2 text-sm"
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
  );
}
