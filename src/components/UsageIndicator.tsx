"use client";

import { useEffect, useState } from "react";
import { Zap, Crown, TrendingUp } from "lucide-react";

interface UsageData {
  plan: "free" | "active";
  used: number;
  limit: number | null;
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => {});
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManage() {
    setManaging(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setManaging(false);
    }
  }

  if (!usage) return null;

  if (usage.plan === "active") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-[var(--color-ink)]">Pro</span>
        <button
          onClick={handleManage}
          disabled={managing}
          className="ml-1 text-xs text-[var(--color-mute)] underline-offset-2 hover:underline disabled:opacity-50"
        >
          {managing ? "Loading…" : "Manage"}
        </button>
      </div>
    );
  }

  const limit = usage.limit ?? 3;
  const remaining = Math.max(0, limit - usage.used);
  const exhausted = remaining === 0;

  return (
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
        onClick={handleUpgrade}
        disabled={upgrading}
        className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        <Zap className="h-3 w-3" />
        {upgrading ? "Loading…" : "Upgrade"}
      </button>
    </div>
  );
}
