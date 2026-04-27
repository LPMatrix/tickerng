"use client";

import { useEffect, useState } from "react";
import { Crown, TrendingUp, Zap, AlertCircle } from "lucide-react";

interface UsageData {
  plan: "free" | "active";
  used: number;
  limit: number | null;
}

export function BillingProfileContent() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => setUsage(null));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Could not start checkout");
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setUpgrading(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Cancellation failed");
      }
      setUsage((u) => (u ? { ...u, plan: "free" } : u));
      setCancelConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  if (!usage) {
    return <p className="text-sm text-gray-500">Loading billing…</p>;
  }

  if (usage.plan === "active") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Crown className="h-4 w-4 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Pro — ₦10,000/month</p>
            <p className="text-xs text-gray-500">Unlimited verification reports</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {cancelConfirm ? (
          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-700">
              Cancel your Pro subscription? You'll keep access until the end of the current billing period.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                onClick={() => setCancelConfirm(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep subscription
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCancelConfirm(true)}
            className="text-xs text-gray-400 underline-offset-2 hover:text-red-600 hover:underline"
          >
            Cancel subscription
          </button>
        )}
      </div>
    );
  }

  const limit = usage.limit ?? 3;
  const remaining = Math.max(0, limit - usage.used);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">Verification usage this month</p>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <div className="flex gap-0.5">
            {Array.from({ length: limit }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < usage.used ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {remaining === 0 ? "0 left" : `${remaining}/${limit} left`}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900">Pro — ₦10,000/month</p>
        <p className="mt-1 text-xs text-gray-500">Unlimited verification reports</p>
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          className="mt-3 flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          <Zap className="h-3 w-3" />
          {upgrading ? "Redirecting to Paystack…" : "Upgrade to Pro"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
