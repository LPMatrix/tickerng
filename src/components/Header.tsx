"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="mb-[var(--space-block)] flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          EquiScan
        </h1>
        <p className="mt-1 text-sm text-[var(--color-mute)]">
          NGX research — discovery and verification reports
        </p>
      </div>
      {status === "authenticated" && session?.user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-mute)]">
            {session.user.email}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-dim)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
