"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getStoredUser, type User } from "@/lib/api";

export function AuthGuard({ children }: { children: (user: User) => ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ user: User }>("/me")
      .then((payload) => {
        window.localStorage.setItem("support_ticket_user", JSON.stringify(payload.user));
        setUser(payload.user);
      })
      .catch(() => {
        const fallback = getStoredUser();
        if (fallback) {
          setUser(fallback);
        } else {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-[#f4f6f8]" />;
  }

  if (!user) {
    return null;
  }

  return children(user);
}
