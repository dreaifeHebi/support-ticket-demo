"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, type User } from "@/lib/api";

export type ChatLink = {
  label: string;
  href: string;
};

export type ChatMessage = {
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

function storageKey(userId: string) {
  return `support_ticket_chat_messages:${userId}`;
}

function initialMessage(user: User): ChatMessage {
  return {
    role: "assistant",
    content:
      user.role === "ADMIN"
        ? "Ask me to find tickets, add comments, or update ticket status, priority, and assignment."
        : "Ask me to find your tickets, create a ticket, or add a comment to your ticket."
  };
}

function readMessages(user: User) {
  if (typeof window === "undefined") {
    return [initialMessage(user)];
  }

  const raw = window.localStorage.getItem(storageKey(user.id));
  if (!raw) {
    return [initialMessage(user)];
  }

  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [initialMessage(user)];
  } catch {
    return [initialMessage(user)];
  }
}

export function usePersistentChat(user: User) {
  const key = useMemo(() => storageKey(user.id), [user.id]);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialMessage(user)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    setMessages(readMessages(user));
    setHydratedKey(key);
  }, [key, user.role]);

  useEffect(() => {
    if (hydratedKey === key) {
      window.localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [hydratedKey, key, messages]);

  const requestMessages = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim())
        .slice(-8)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const payload = await apiFetch<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...requestMessages, { role: "user", content: trimmed }]
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

  function clearMessages() {
    const nextMessages = [initialMessage(user)];
    setMessages(nextMessages);
    setError("");
    window.localStorage.setItem(key, JSON.stringify(nextMessages));
  }

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    clearMessages
  };
}
