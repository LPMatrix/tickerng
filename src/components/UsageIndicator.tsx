"use client";

import { useEffect, useState } from "react";
import { PricingTable } from "@clerk/nextjs";
import { Zap, Crown, TrendingUp, X } from "lucide-react";

interface UsageData {
  plan: "free" | "pro";
  used: number;
  limit: number | null;
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => {});
  }, []);

  if (!usage) return null;

  if (usage.plan === "pro") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-[var(--color-ink)]">Pro</span>
      </div>
    );
  }

  const limit = usage.limit ?? 3;
  const remaining = Math.max(0, limit - usage.used);
  const exhausted = remaining === 0;

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <div className="flex items-center gap-2">
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
            {exhausted ? "0 left" : `${remaining}/${limit} left`}
          </span>
        </div>

        <button
          onClick={() => setShowUpgrade(true)}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          <Zap className="h-3 w-3" />
          Upgrade
        </button>
      </div>

      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUpgrade(false); }}
        >
          <div className="relative w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl">
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-[var(--color-mute)] hover:text-[var(--color-ink)]"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="mb-6 font-display text-xl font-semibold text-[var(--color-ink)]">
              Upgrade your plan
            </h2>
            <PricingTable />
          </div>
        </div>
      )}
    </>
  );
}
