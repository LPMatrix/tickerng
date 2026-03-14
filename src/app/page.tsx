"use client";

import { useState, useCallback } from "react";
import { ModeSelector, type ResearchMode } from "@/components/ModeSelector";
import { ResearchForm } from "@/components/ResearchForm";
import { ReportView } from "@/components/ReportView";

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

  const handleSubmit = useCallback(async (query: string) => {
    setReport("");
    setIsRunning(true);
    try {
      // TODO: wire to API route that streams Claude response
      // For now simulate a placeholder report so UI is testable
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
    } catch {
      setReport("## Error\n\nUnable to run research. Ensure the API route is implemented and Claude API is configured.");
    } finally {
      setIsRunning(false);
    }
  }, [mode]);

  return (
    <div className="mx-auto min-h-screen max-w-[var(--content-max)] px-[var(--space-gutter)] py-[var(--space-block)]">
      {/* Header: identity + one-line purpose */}
      <header className="mb-[var(--space-block)]">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          EquiScan
        </h1>
        <p className="mt-1 text-sm text-[var(--color-mute)]">
          NGX research — discovery and verification reports
        </p>
      </header>

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

      {/* Report output: streamed structured content */}
      {report ? (
        <ReportView content={report} isStreaming={isRunning} />
      ) : (
        <div className="mt-[var(--space-block)] border-t border-[var(--color-border)] pt-[var(--space-block)]">
          <p className="text-sm text-[var(--color-mute)]">
            Select a mode, enter a ticker or discovery query, and run research. Reports appear here.
          </p>
        </div>
      )}
    </div>
  );
}
