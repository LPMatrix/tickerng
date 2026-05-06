"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ModeSelector, type ResearchMode } from "@/components/ModeSelector";
import { ResearchForm } from "@/components/ResearchForm";
import { ReportView } from "@/components/ReportView";
import { ReportHistory } from "@/components/ReportHistory";
import { Header } from "@/components/Header";
import { ReportExport } from "@/components/ReportExport";
import { UsageIndicator } from "@/components/UsageIndicator";
import { Sparkles, FileText, BarChart3, ChevronLeft, ChevronRight, History } from "lucide-react";

/**
 * TickerNG Research Dashboard
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
  const [usageVersion, setUsageVersion] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tickerng:sidebar");
    if (saved === "closed") setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [mounted]);

  useEffect(() => {
    if (!sidebarOpen || !isMobileLayout) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        localStorage.setItem("tickerng:sidebar", "closed");
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen, isMobileLayout]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("tickerng:sidebar", next ? "open" : "closed");
      return next;
    });
  }, []);

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
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        const quota = data.quota;
        setReport(
          `## Verification limit reached\n\nYou've used all ${quota?.limit ?? 3} free verifications this month.\n\n` +
          `**Upgrade to Pro** for unlimited verifications — click the Upgrade button above.`
        );
        setUsageVersion((v) => v + 1);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again. If the problem continues, contact support.";
        setReport(`## Error\n\n${msg}`);
        return;
      }
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
          if (effectiveMode === "verification") setUsageVersion((v) => v + 1);
        }
      }
    } catch (e) {
      const isNetwork = e instanceof TypeError && e.message === "Failed to fetch";
      setReport(
        `## Error\n\n${
          isNetwork
            ? "We couldn't reach the server. Check your connection and try again."
            : "Something went wrong. Please try again. If the problem continues, contact support."
        }`
      );
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

  const handleSelectReportAndCloseMobile = useCallback(
    async (id: string) => {
      await handleSelectReport(id);
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        setSidebarOpen(false);
        localStorage.setItem("tickerng:sidebar", "closed");
      }
    },
    [handleSelectReport]
  );

  const hasReport = report.trim().length > 0;

  const sidebarInner = (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-6 md:sticky md:top-0 md:max-h-[calc(100vh-4rem)]">
      <div className="mb-4 flex flex-shrink-0 items-center justify-between md:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-mute)]">
          Recent Reports
        </span>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md p-1 text-[var(--color-mute)] hover:text-[var(--color-accent)]"
          aria-label="Close recent reports"
        >
          <ChevronLeft className="h-4 w-4 rotate-90" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
        <ReportHistory
          reportsVersion={reportsVersion}
          onSelectReport={handleSelectReportAndCloseMobile}
          currentReportId={currentReportId}
          onReportDeleted={(id) => {
            if (currentReportId === id) {
              setCurrentReportId(null);
              setReport("");
              setQuery("");
            }
          }}
        />
      </div>
    </div>
  );

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

      <div className="relative flex flex-1 flex-col md:flex-row">
        {mounted &&
          sidebarOpen &&
          isMobileLayout &&
          createPortal(
            <div className="fixed inset-0 z-[200] md:hidden" data-tickerng-mobile-reports-drawer>
              <button
                type="button"
                aria-label="Close reports sidebar"
                className="absolute inset-0 bg-[var(--color-ink)]/40 backdrop-blur-[1px]"
                onClick={toggleSidebar}
              />
              <aside
                aria-label="Recent reports"
                className="absolute bottom-0 right-0 top-16 z-10 flex w-[88vw] max-w-[21rem] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
              >
                {sidebarInner}
              </aside>
            </div>,
            document.body
          )}

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
                <div className="hidden flex-col items-end gap-2 sm:flex">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <UsageIndicator key={usageVersion} />
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

        {/* Sidebar: desktop inline column; mobile drawer is portaled to document.body */}
        <aside
          aria-label="Recent reports"
          className={`relative flex-shrink-0 border-[var(--color-border)] bg-[var(--color-surface)] transition-[transform,width,box-shadow] duration-300 ease-out md:border-l md:border-t-0 ${
            sidebarOpen
              ? "max-md:hidden md:relative md:flex md:h-auto md:min-h-0 md:w-80 md:flex-col md:border-l md:shadow-none"
              : "hidden md:relative md:flex md:h-auto md:w-10"
          }`}
        >
          {/* Collapse toggle — desktop only */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute -left-3.5 top-6 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-mute)] shadow-sm transition-colors hover:text-[var(--color-accent)] md:flex"
          >
            {sidebarOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Collapsed state — icon strip (desktop) */}
          {!sidebarOpen && (
            <div className="hidden h-full flex-col items-center pt-6 md:flex">
              <History className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
          )}

          {/* Expanded content (desktop only — mobile uses portal) */}
          {sidebarOpen && sidebarInner}
        </aside>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="fixed bottom-5 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow-lg md:hidden"
            aria-label="Open recent reports"
            title="Recent reports"
          >
            <History className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
