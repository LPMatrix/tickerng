"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { BarChart3, ArrowLeft } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="mb-[var(--space-block)]">
      {/* Back link */}
      <Link 
        href="/" 
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-mute)] hover:text-[var(--color-accent)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
              EquiScan
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-mute)]">
              NGX research — discovery and verification reports
            </p>
          </div>
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
      </div>
    </header>
  );
}
