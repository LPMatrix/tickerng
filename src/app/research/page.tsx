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
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Main content */}
      <main className="min-w-0 flex-1 px-[var(--space-gutter)] py-[var(--space-block)] md:max-w-[var(--content-max)]">
        <Header />

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

        {report ? (
          <ReportView content={report} isStreaming={isRunning} />
        ) : (
          <div className="mt-[var(--space-block)] border-t border-[var(--color-border)] pt-[var(--space-block)]">
            <p className="text-sm text-[var(--color-mute)]">
              Select a mode, enter a ticker or discovery query, and run research. Reports are saved automatically and listed in the sidebar.
            </p>
          </div>
        )}
      </main>

      {/* Sidebar: recent reports */}
      <aside
        className="w-full border-t border-[var(--color-border)] bg-[var(--color-surface)] md:w-64 md:min-h-screen md:max-h-screen md:border-l md:border-t-0 md:sticky md:top-0 md:flex md:flex-col md:self-start"
        aria-label="Recent reports"
      >
        <div className="flex-1 overflow-y-auto p-4">
          <ReportHistory
            reportsVersion={reportsVersion}
            onSelectReport={handleSelectReport}
            currentReportId={currentReportId}
          />
        </div>
      </aside>
    </div>
  );
}
