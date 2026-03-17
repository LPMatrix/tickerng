"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReportView } from "@/components/ReportView";
import { FileText, BarChart3, AlertCircle } from "lucide-react";

type ShareData = {
  content: string;
  mode: string;
  query: string;
} | null;

export default function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<ShareData>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-ink)]">
            <BarChart3 className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-display text-lg font-semibold">EquiScan</span>
          </Link>
        </header>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold text-[var(--color-ink)]">
            Link expired or invalid
          </h1>
          <p className="mt-2 text-[var(--color-mute)]">
            This share link may have been revoked or has expired.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
          >
            Go to EquiScan
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-mute)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-ink)]">
            <BarChart3 className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-display text-lg font-semibold">EquiScan</span>
          </Link>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-mute)]">
            Shared report
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-[var(--color-ink)]">
              {data.mode === "verification" ? "Verification Report" : "Discovery Results"}
            </h1>
            <p className="text-sm text-[var(--color-mute)]">{data.query}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <ReportView content={data.content} isStreaming={false} />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-mute)]">
          <Link href="/" className="text-[var(--color-accent)] hover:underline">
            Create your own reports with EquiScan
          </Link>
        </p>
      </main>
    </div>
  );
}
