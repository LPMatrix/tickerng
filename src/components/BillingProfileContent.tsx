"use client";

import { useEffect, useState } from "react";
import { PricingTable } from "@clerk/nextjs";
import { Crown, TrendingUp } from "lucide-react";

interface UsageData {
  plan: "free" | "pro";
  used: number;
  limit: number | null;
}

export function BillingProfileContent() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => setUsage(null));
  }, []);

  if (!usage) {
    return (
      <div className="text-sm text-[var(--color-mute)]">Loading billing…</div>
    );
  }

  if (usage.plan === "pro") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-[var(--color-ink)]">Pro</span>
        </div>
        <p className="text-sm text-[var(--color-mute)]">
          You have unlimited verification reports. Subscription and payment details are managed here.
        </p>
        <div className="pt-2">
          <PricingTable />
        </div>
      </div>
    );
  }

  const limit = usage.limit ?? 3;
  const remaining = Math.max(0, limit - usage.used);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">Verification usage (this month)</p>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <TrendingUp className="h-4 w-4 text-[var(--color-mute)]" />
          <div className="flex gap-0.5">
            {Array.from({ length: limit }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < usage.used
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border-strong)]"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--color-mute)]">
            {remaining === 0 ? "0 left" : `${remaining}/${limit} left`}
          </span>
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">Plans</p>
        <PricingTable />
      </div>
    </div>
  );
}
