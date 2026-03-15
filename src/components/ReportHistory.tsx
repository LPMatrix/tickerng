"use client";

import { useEffect, useState } from "react";

export type ReportSummary = {
  id: string;
  mode: string;
  query: string;
  createdAt: string;
};

export function ReportHistory({
  onSelectReport,
  currentReportId,
  reportsVersion = 0,
}: {
  onSelectReport: (id: string) => void;
  currentReportId: string | null;
  reportsVersion?: number;
}) {
  const [list, setList] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportsVersion]);

  const refresh = () => {
    setLoading(true);
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  if (loading && list.length === 0) {
    return (
      <p className="text-sm text-[var(--color-mute)]">Loading recent reports…</p>
    );
  }
  if (list.length === 0) {
    return (
      <p className="text-sm text-[var(--color-mute)]">
        No saved reports yet. Run a research query to save one.
      </p>
    );
  }

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      const now = new Date();
      const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-mute)]">
          Recent reports
        </span>
        <button
          type="button"
          onClick={refresh}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Refresh
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {list.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onSelectReport(r.id)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                currentReportId === r.id
                  ? "bg-[var(--color-accent-dim)] font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-mute)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span className="block truncate">
                {r.mode === "verification" ? r.query : r.query.slice(0, 40)}
                {r.query.length > 40 ? "…" : ""}
              </span>
              <span className="block text-xs opacity-80">
                {r.mode} · {formatDate(r.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
