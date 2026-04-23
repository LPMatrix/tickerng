"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BarChart3, ChevronRight, CreditCard } from "lucide-react";

function BillingIcon() {
  return <CreditCard className="h-4 w-4" />;
}

export function Header() {
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
              className="text-[var(--color-mute)] transition-colors hover:text-[var(--color-ink)]"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[var(--color-mute-light)]" />
            <span className="font-medium text-[var(--color-ink)]">Research</span>
          </nav>
        </div>

        {/* User Actions */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
              userButtonTrigger:
                "rounded-full ring-2 ring-transparent hover:ring-[var(--color-accent)]/30 focus-visible:ring-[var(--color-accent)] transition-shadow",
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Manage billing"
              labelIcon={<BillingIcon />}
              href="/account/billing"
            />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </header>
  );
}
