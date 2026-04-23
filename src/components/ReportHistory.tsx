"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  RefreshCw, 
  Clock, 
  ChevronRight,
  History,
  Download,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
  onReportDeleted,
}: {
  onSelectReport: (id: string) => void;
  currentReportId: string | null;
  reportsVersion?: number;
  onReportDeleted?: (id: string) => void;
}) {
  const [list, setList] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Export single report as PDF
  const handleExportPDF = async (report: ReportSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (exportingId === report.id) return;

    setExportingId(report.id);
    try {
      // Fetch full report content
      const res = await fetch(`/api/reports/${report.id}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      const content = data.content || "";

      // Create a temporary element for rendering
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: 800px; background: white; padding: 40px;
        font-family: system-ui, sans-serif; line-height: 1.6;
      `;
      tempDiv.innerHTML = `
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #0d5c3d;">
          TickerNG Report
        </h1>
        <p style="color: #6b6b6b; margin-bottom: 24px;">
          <strong>Mode:</strong> ${getModeLabel(report.mode)}<br/>
          <strong>Query:</strong> ${report.query}<br/>
          <strong>Generated:</strong> ${new Date(report.createdAt).toLocaleString()}
        </p>
        <hr style="border: none; border-top: 1px solid #e8e6e3; margin: 24px 0;" />
        <div style="white-space: pre-wrap;">${content}</div>
      `;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `tickerng-report-${report.query.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}-${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (report: ReportSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === report.id) return;
    if (
      !window.confirm(
        "Delete this report? Shared links will stop working. This cannot be undone."
      )
    ) {
      return;
    }
    setDeletingId(report.id);
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        throw new Error("Delete failed");
      }
      setList((prev) => prev.filter((r) => r.id !== report.id));
      onReportDeleted?.(report.id);
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Could not delete the report. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Copy report content as markdown
  const handleCopyMarkdown = async (report: ReportSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (copiedId === report.id) return;

    try {
      const res = await fetch(`/api/reports/${report.id}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      const content = data.content || "";

      await navigator.clipboard.writeText(content);
      setCopiedId(report.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
                <div
                  className={`
                    group relative rounded-xl border p-3 transition-all
                    ${isActive
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 shadow-sm"
                      : "border-transparent bg-[var(--color-bg)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    }
                  `}
                >
                  {/* Main Clickable Area */}
                  <button
                    type="button"
                    onClick={() => onSelectReport(report.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
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
                  </button>

                  {/* Action Buttons */}
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-1 border-t border-[var(--color-border)] pt-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyMarkdown(report, e)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-mute)] transition-colors hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                      title="Copy as Markdown"
                    >
                      {copiedId === report.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Export Button */}
                    <button
                      type="button"
                      onClick={(e) => handleExportPDF(report, e)}
                      disabled={exportingId === report.id}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-mute)] transition-colors hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] disabled:opacity-50"
                      title="Export as PDF"
                    >
                      {exportingId === report.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>{exportingId === report.id ? "Exporting..." : "PDF"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(report, e)}
                      disabled={deletingId === report.id}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--color-mute)] transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                      title="Delete report"
                    >
                      {deletingId === report.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-red-500" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      <span>{deletingId === report.id ? "…" : "Delete"}</span>
                    </button>
                  </div>
                </div>
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
