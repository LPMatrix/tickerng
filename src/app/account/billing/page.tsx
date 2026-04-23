"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/billing/portal", { method: "POST" })
      .then((r) => r.json())
      .then(({ url, error }) => {
        if (url) {
          window.location.href = url;
        } else {
          // No billing account yet — go to checkout instead
          console.error("[billing] portal error:", error);
          router.replace("/research");
        }
      })
      .catch(() => router.replace("/research"));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-3 text-[var(--color-mute)]">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
        <p className="text-sm">Opening billing portal…</p>
      </div>
    </div>
  );
}
