"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
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
  
  const placeholders = {
    discovery: "e.g., Best dividend-paying stocks in the banking sector with P/E under 10",
    verification: "Enter NGX ticker symbol (e.g., GTCO, DANGCEM, ZENITHBANK)",
  };
  
  const labels = {
    discovery: "Discovery Query",
    verification: "Stock Ticker",
  };
  
  const hints = {
    discovery: "Ask natural language questions to discover stocks matching your investment criteria.",
    verification: "Enter a ticker symbol to generate a comprehensive research report with financials, valuation, and recommendation.",
  };

  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isRunning) return;
    onSubmit(trimmed);
  };

  // Quick suggestions for discovery mode
  const suggestions = isDiscovery ? [
    "Best dividend stocks",
    "Banking sector opportunities",
    "Low P/E value stocks",
    "High growth tech stocks",
  ] : [
    "GTCO",
    "DANGCEM",
    "ZENITHBANK",
    "MTNN",
  ];

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Label */}
      <div className="mb-3 flex items-center gap-2">
        <label 
          htmlFor="research-input" 
          className="text-sm font-semibold text-[var(--color-ink)]"
        >
          {labels[mode]}
        </label>
        <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]">
          {isDiscovery ? "Natural language" : "Ticker symbol"}
        </span>
      </div>

      {/* Input Container */}
      <div className="relative">
        <div className={`
          flex flex-col gap-3 rounded-xl border bg-[var(--color-surface)] p-2 shadow-sm transition-all
          ${isRunning 
            ? "border-[var(--color-accent)]/30 ring-2 ring-[var(--color-accent)]/10" 
            : "border-[var(--color-border-strong)] focus-within:border-[var(--color-accent)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/10"
          }
        `}>
          {/* Input Field */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mute)]">
              <Search className="h-5 w-5" />
            </div>
            
            {isDiscovery ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                id="research-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholders[mode]}
                disabled={isRunning}
                rows={3}
                className="
                  min-h-[80px] w-full resize-none bg-transparent pl-10 pr-4 py-3
                  font-body text-[var(--color-ink)] placeholder:text-[var(--color-mute-light)]
                  focus:outline-none
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
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                placeholder={placeholders[mode]}
                disabled={isRunning}
                autoCapitalize="characters"
                className="
                  h-12 w-full bg-transparent pl-10 pr-4
                  font-body text-[var(--color-ink)] placeholder:text-[var(--color-mute-light)]
                  focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-70
                "
                aria-describedby="research-hint"
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-2 pt-2">
            <p id="research-hint" className="hidden text-xs text-[var(--color-mute)] sm:block">
              {hints[mode]}
            </p>
            <button
              type="submit"
              disabled={!value.trim() || isRunning}
              className="
                ml-auto inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] 
                px-5 py-2.5 font-medium text-white shadow-sm
                transition-all hover:bg-[var(--color-accent)]/90 hover:shadow
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none
              "
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <span>Run Research</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      {!isRunning && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-mute)]">Try:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setValue(suggestion)}
              className="
                rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] 
                px-3 py-1 text-xs text-[var(--color-mute)] 
                transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)]
              "
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
