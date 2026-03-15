"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/signin?registered=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[var(--content-max)] flex-col justify-center px-[var(--space-gutter)] py-[var(--space-block)]">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          Create account
        </h1>
        <p className="mt-1 text-sm text-[var(--color-mute)]">
          EquiScan — NGX research
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="mt-1 block w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <span className="mt-0.5 block text-xs text-[var(--color-mute)]">
              At least 8 characters
            </span>
          </label>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--color-accent)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-[var(--color-mute)]">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-[var(--color-accent)] underline underline-offset-2 hover:no-underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
