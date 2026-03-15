"use client";

import { useState, useCallback } from "react";
import { ModeSelector, type ResearchMode } from "@/components/ModeSelector";
import { ResearchForm } from "@/components/ResearchForm";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
import { Header } from "@/components/Header";

/**
 * EquiScan — NGX Research Tool
 * Design: Editorial Terminal — report-first, clear mode selection, one accent (deep green).
 * Avoids generic UI by: mode selector as primary control (not hidden tabs), asymmetric layout,
 * and report sections with strong serif hierarchy instead of chat bubbles.
 */
export default function Home() {
  const [mode, setMode] = useState<ResearchMode>("verification");
  const [report, setReport] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);

  const handleSubmit = useCallback(async (query: string) => {
    setReport("");
    setCurrentReportId(null);
    setIsRunning(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, query }),
      });
      if (!res.ok) throw new Error("Research request failed");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        const data = await res.json().catch(() => ({}));
        setReport((data.content as string) ?? "No content returned.");
        return;
      }
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReport(acc);
      }
      if (acc.trim()) {
        const saveRes = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, query, content: acc }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json();
          setCurrentReportId(id);
          setReportsVersion((v) => v + 1);
        }
      }
    } catch {
      setReport("## Error\n\nUnable to run research. Ensure the API route is implemented and Claude API is configured.");
    } finally {
      setIsRunning(false);
    }
  }, [mode]);

  const handleSelectReport = useCallback(async (id: string) => {
    setCurrentReportId(id);
    setReport("");
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setReport(data.content ?? "");
    } catch {
      setReport("## Error\n\nCould not load report.");
    }
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-[var(--content-max)] px-[var(--space-gutter)] py-[var(--space-block)]">
      <Header />

      {/* Mode + form: primary action surface */}
      <section
        role="tabpanel"
        id={mode === "discovery" ? "discovery-panel" : "verification-panel"}
        aria-labelledby={`mode-${mode}`}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <ModeSelector value={mode} onChange={setMode} disabled={isRunning} />
        </div>
        <ResearchForm
          mode={mode}
          onSubmit={handleSubmit}
          isRunning={isRunning}
        />
      </section>

      {/* Report output: streamed or loaded from history */}
      {report ? (
        <ReportView content={report} isStreaming={isRunning} />
      ) : (
        <div className="mt-[var(--space-block)] flex flex-col gap-6 border-t border-[var(--color-border)] pt-[var(--space-block)] sm:flex-row sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--color-mute)]">
              Select a mode, enter a ticker or discovery query, and run research. Reports are saved automatically and appear below.
            </p>
          </div>
          <aside className="w-full shrink-0 sm:w-56">
            <ReportHistory
              reportsVersion={reportsVersion}
              onSelectReport={handleSelectReport}
              currentReportId={currentReportId}
            />
          </aside>
        </div>
      )}

      {/* When viewing a report, show history in sidebar */}
      {report && (
        <aside className="mt-[var(--space-block)] border-t border-[var(--color-border)] pt-[var(--space-block)]">
          <ReportHistory
            reportsVersion={reportsVersion}
            onSelectReport={handleSelectReport}
            currentReportId={currentReportId}
          />
        </aside>
      )}
    </div>
  );
}
