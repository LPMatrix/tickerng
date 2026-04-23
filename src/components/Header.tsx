"use client";

import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { BarChart3, LogOut, User, ChevronRight } from "lucide-react";

export function Header() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/80">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="hidden font-display text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:block">
              TickerNG
            </span>
          </Link>

          <div className="hidden h-4 w-px bg-[var(--color-border-strong)] sm:block" />

          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link
              href="/"
              className="text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[var(--color-mute-light)]" />
            <span className="font-medium text-[var(--color-ink)]">Research</span>
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {isLoaded && user ? (
            <>
              <div className="hidden items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[150px] truncate text-sm text-[var(--color-ink)]">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/signin" })}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-mute)] transition-all hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-border)]" />
          )}
        </div>
      </div>
    </header>
  );
}
