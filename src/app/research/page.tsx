"use client";

import { useState, useCallback } from "react";
import { ModeSelector, type ResearchMode } from "@/components/ModeSelector";
import { ResearchForm } from "@/components/ResearchForm";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
import { Header } from "@/components/Header";
import { ReportExport } from "@/components/ReportExport";
import { Sparkles, FileText, BarChart3 } from "lucide-react";

/**
 * EquiScan Research Dashboard
 * A polished, market-ready research interface with clear visual hierarchy,
 * refined interactions, and professional presentation.
 */
export default function ResearchPage() {
  const [mode, setMode] = useState<ResearchMode>("verification");
  const [report, setReport] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(async (
    inputQuery: string,
    options?: { modeOverride?: ResearchMode; includeMacroContext?: boolean }
  ) => {
    const effectiveMode = options?.modeOverride ?? mode;
    setMode(effectiveMode);
    setQuery(inputQuery);
    setReport("");
    setCurrentReportId(null);
    setIsRunning(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: effectiveMode,
          query: inputQuery,
          includeMacroContext: options?.includeMacroContext ?? true,
        }),
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
          body: JSON.stringify({ mode: effectiveMode, query: inputQuery, content: acc }),
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
      setQuery(data.query ?? "");
      setMode(data.mode as ResearchMode);
    } catch {
      setReport("## Error\n\nCould not load report.");
    }
  }, []);

  const hasReport = report.trim().length > 0;

  const handleShare = useCallback(async () => {
    if (!currentReportId) return;
    try {
      const res = await fetch(`/api/reports/${currentReportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create link");
      const { url } = await res.json();
      await navigator.clipboard.writeText(url);
    } catch {
      // Feedback is shown in ReportExport dropdown (linkCopied / error)
    }
  }, [currentReportId]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      {/* Top Navigation Bar */}
      <Header />

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            {/* Welcome / Status Card */}
            <div className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] md:text-3xl">
                    Research Dashboard
                  </h1>
                  <p className="mt-2 max-w-xl text-[var(--color-mute)]">
                    Select a research mode and enter your query to generate comprehensive NGX stock analysis powered by AI.
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] sm:flex">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>

              {/* Mode Selector - Prominent */}
              <div className="mt-6">
                <ModeSelector value={mode} onChange={setMode} disabled={isRunning} />
              </div>
            </div>

            {/* Input Section */}
            <section
              role="tabpanel"
              id={mode === "discovery" ? "discovery-panel" : "verification-panel"}
              aria-labelledby={`mode-${mode}`}
              className="mb-8"
            >
              <ResearchForm
                mode={mode}
                onSubmit={handleSubmit}
                isRunning={isRunning}
              />
            </section>

            {/* Report Display — show panel while running so v3 specialist phase isn’t an empty state */}
            {hasReport || isRunning ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                {/* Report Header */}
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                        {mode === "verification" ? "Verification Report" : "Discovery Results"}
                      </h2>
                      <p className="truncate text-sm text-[var(--color-mute)]">
                        {query || "Research analysis"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isRunning && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
                        </span>
                        Generating
                      </span>
                    )}
                    
                    {/* Share & Export - Only show when report is complete */}
                    {!isRunning && (
                      <ReportExport
                        content={report}
                        query={query}
                        mode={mode}
                        reportId={currentReportId}
                        onCopyShareLink={handleShare}
                      />
                    )}
                  </div>
                </div>
                
                {/* Report Content */}
                <div className="p-6">
                  {isRunning && !report.trim() ? (
                    <div className="space-y-3 text-[var(--color-mute)]">
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        Running specialist analysts…
                      </p>
                      <p className="text-sm">
                        Four parallel researchers (fundamentals, news, macro, sentiment) are gathering
                        data. When they finish, your report will stream here. This usually takes 30–90
                        seconds before text appears.
                      </p>
                    </div>
                  ) : (
                    <ReportView
                      content={report}
                      isStreaming={isRunning}
                      mode={mode}
                      onRunVerification={(ticker) =>
                        handleSubmit(ticker, { modeOverride: "verification" })
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]/50 p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-ink)]">
                  Ready to research
                </h3>
                <p className="mx-auto mt-2 max-w-md text-[var(--color-mute)]">
                  {mode === "verification"
                    ? "Enter a stock ticker like GTCO or DANGCEM to get a comprehensive analysis report."
                    : "Ask a question like 'best dividend stocks' or 'banking sector opportunities' to discover potential investments."}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar: Recent Reports */}
        <aside
          className="w-full border-t border-[var(--color-border)] bg-[var(--color-surface)] md:w-80 md:min-h-[calc(100vh-80px)] md:border-l md:border-t-0"
          aria-label="Recent reports"
        >
          <div className="sticky top-0 p-6">
            <ReportHistory
              reportsVersion={reportsVersion}
              onSelectReport={handleSelectReport}
              currentReportId={currentReportId}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
