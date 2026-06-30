"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, setSession, type User } from "@/lib/api";

const demoAccounts = [
  { label: "Admin demo", email: "admin@example.com", password: "password123" },
  { label: "User demo", email: "user@example.com", password: "password123" }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = await apiFetch<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setSession(payload.token, payload.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function useDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">SupportOps Login</h1>
          <p className="mt-1 text-sm text-muted">Demo support ticket operations dashboard</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => useDemo(account)}
              className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-panel"
            >
              {account.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
              type="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
              type="password"
              required
            />
          </label>

          {error ? <div className="rounded-md bg-[#fdecec] p-3 text-sm text-danger">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <a href="/register" className="mt-4 block text-center text-sm font-medium text-accent">
          Create a user account
        </a>
      </section>
    </main>
  );
}
