"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Clock, 
  ChevronRight,
  History,
  Trash2
} from "lucide-react";

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

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      const now = new Date();
      const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (sameDay) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear()
      ) {
        return "Yesterday";
      }
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getModeIcon = (mode: string) => {
    return mode === "discovery" ? (
      <Search className="h-3.5 w-3.5" />
    ) : (
      <FileText className="h-3.5 w-3.5" />
    );
  };

  const getModeLabel = (mode: string) => {
    return mode === "discovery" ? "Discovery" : "Verification";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
            Recent Reports
          </h2>
          <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
            {list.length}
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-[var(--color-mute)] transition-colors hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] disabled:opacity-50"
          title="Refresh list"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Report List */}
      {loading && list.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg)]/50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">
            No reports yet
          </p>
          <p className="mt-1 text-xs text-[var(--color-mute)]">
            Run your first research to see it here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((report, index) => {
            const isActive = currentReportId === report.id;
            const isFirstOfDay = index === 0 || 
              formatDate(report.createdAt) !== formatDate(list[index - 1]?.createdAt);

            return (
              <div key={report.id}>
                {/* Date Separator */}
                {isFirstOfDay && (
                  <div className="mb-2 mt-4 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-[var(--color-mute-light)]" />
                    <span className="text-xs font-medium text-[var(--color-mute-light)]">
                      {formatDate(report.createdAt)}
                    </span>
                    <div className="flex-1 border-b border-[var(--color-border)]" />
                  </div>
                )}

                {/* Report Card */}
                <button
                  type="button"
                  onClick={() => onSelectReport(report.id)}
                  className={`
                    group w-full rounded-xl border p-3 text-left transition-all
                    ${isActive
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-sm"
                      : "border-transparent bg-[var(--color-bg)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Mode Icon */}
                    <div className={`
                      flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                      ${isActive 
                        ? "bg-[var(--color-accent)] text-white" 
                        : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      }
                    `}>
                      {getModeIcon(report.mode)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`
                        truncate text-sm font-medium
                        ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"}
                      `}>
                        {report.mode === "verification" 
                          ? report.query 
                          : report.query.slice(0, 40) + (report.query.length > 40 ? "…" : "")
                        }
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-[var(--color-mute)]">
                          {getModeLabel(report.mode)}
                        </span>
                        <span className="text-[var(--color-border-strong)]">·</span>
                        <span className="text-xs text-[var(--color-mute-light)]">
                          {new Date(report.createdAt).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ChevronRight className={`
                      h-4 w-4 flex-shrink-0 transition-opacity
                      ${isActive 
                        ? "text-[var(--color-accent)]" 
                        : "text-[var(--color-mute-light)] opacity-0 group-hover:opacity-100"
                      }
                    `} />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      {list.length > 0 && (
        <p className="pt-4 text-center text-xs text-[var(--color-mute-light)]">
          Reports are saved automatically
        </p>
      )}
    </div>
  );
}
