"use client";

import { useState, useRef, useEffect } from "react";
import type { ResearchMode } from "./ModeSelector";

interface ResearchFormProps {
  mode: ResearchMode;
  onSubmit: (query: string) => void;
  isRunning: boolean;
}

export function ResearchForm({ mode, onSubmit, isRunning }: ResearchFormProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const isDiscovery = mode === "discovery";
  const placeholder = isDiscovery
    ? "e.g. best banking stocks right now"
    : "Enter NGX ticker (e.g. GTCO, DANGCEM)";
  const label = isDiscovery ? "Discovery query" : "Ticker symbol";

  useEffect(() => {
    setValue("");
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[var(--content-max)]">
      <label htmlFor="research-input" className="sr-only">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        {isDiscovery ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id="research-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isRunning}
            rows={2}
            className="
              min-h-[80px] w-full resize-y rounded-lg border border-[var(--color-border-strong)]
              bg-[var(--color-surface)] px-4 py-3 font-body text-[var(--color-ink)]
              placeholder:text-[var(--color-mute-light)]
              focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]
              disabled:cursor-not-allowed disabled:opacity-70
            "
            aria-describedby="research-hint"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            id="research-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isRunning}
            autoCapitalize="characters"
            className="
              w-full rounded-lg border border-[var(--color-border-strong)]
              bg-[var(--color-surface)] px-4 py-3 font-body text-[var(--color-ink)]
              placeholder:text-[var(--color-mute-light)]
              focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]
              disabled:cursor-not-allowed disabled:opacity-70
            "
            aria-describedby="research-hint"
          />
        )}
        <button
          type="submit"
          disabled={!value.trim() || isRunning}
          className="
            shrink-0 rounded-lg bg-[var(--color-accent)] px-5 py-3 font-medium text-white
            transition-colors hover:bg-[var(--color-accent)]/90
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isRunning ? "Running…" : "Run research"}
        </button>
      </div>
      <p id="research-hint" className="mt-2 text-sm text-[var(--color-mute)]">
        {isDiscovery
          ? "Get a shortlist of 3–5 NGX stocks with strong potential and brief rationale."
          : "Get a structured report: financials, valuation, catalysts, verdict."}
      </p>
    </form>
  );
}
