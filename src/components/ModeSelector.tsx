"use client";

import { Search, FileCheck } from "lucide-react";

export type ResearchMode = "discovery" | "verification";

interface ModeSelectorProps {
  value: ResearchMode;
  onChange: (mode: ResearchMode) => void;
  disabled?: boolean;
}

/**
 * Premium Mode Selector with clear visual distinction between
 * Discovery (exploratory) and Verification (analytical) modes.
 */
export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Research mode"
      className="grid grid-cols-2 gap-3 sm:inline-flex sm:rounded-xl sm:border sm:border-[var(--color-border-strong)] sm:bg-[var(--color-surface)] sm:p-1.5"
    >
      {/* Discovery Mode */}
      <button
        type="button"
        role="tab"
        aria-selected={value === "discovery"}
        aria-controls="discovery-panel"
        id="mode-discovery"
        disabled={disabled}
        onClick={() => onChange("discovery")}
        className={`
          group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all
          sm:flex-row sm:items-center sm:gap-3 sm:rounded-lg sm:border-0 sm:px-5 sm:py-3
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${value === "discovery"
            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-md sm:shadow-sm"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5"
          }
        `}
      >
        <div className={`
          flex h-10 w-10 items-center justify-center rounded-lg transition-colors
          ${value === "discovery"
            ? "bg-white/20"
            : "bg-[var(--color-accent)]/10 group-hover:bg-[var(--color-accent)]/20"
          }
        `}>
          <Search className={`h-5 w-5 ${value === "discovery" ? "text-white" : "text-[var(--color-accent)]"}`} />
        </div>
        <div>
          <span className={`
            block font-display text-base font-semibold
            ${value === "discovery" ? "text-white" : "text-[var(--color-ink)]"}
          `}>
            Discovery
          </span>
          <span className={`
            block text-sm
            ${value === "discovery" ? "text-white/80" : "text-[var(--color-mute)]"}
          `}>
            Find stocks by criteria
          </span>
        </div>
        
        {/* Selection indicator for mobile card view */}
        <div className={`
          absolute right-4 top-4 h-2 w-2 rounded-full sm:hidden
          ${value === "discovery" ? "bg-white" : "bg-[var(--color-border-strong)]"}
        `} />
      </button>

      {/* Verification Mode */}
      <button
        type="button"
        role="tab"
        aria-selected={value === "verification"}
        aria-controls="verification-panel"
        id="mode-verification"
        disabled={disabled}
        onClick={() => onChange("verification")}
        className={`
          group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all
          sm:flex-row sm:items-center sm:gap-3 sm:rounded-lg sm:border-0 sm:px-5 sm:py-3
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${value === "verification"
            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-md sm:shadow-sm"
            : "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5"
          }
        `}
      >
        <div className={`
          flex h-10 w-10 items-center justify-center rounded-lg transition-colors
          ${value === "verification"
            ? "bg-white/20"
            : "bg-[var(--color-accent)]/10 group-hover:bg-[var(--color-accent)]/20"
          }
        `}>
          <FileCheck className={`h-5 w-5 ${value === "verification" ? "text-white" : "text-[var(--color-accent)]"}`} />
        </div>
        <div>
          <span className={`
            block font-display text-base font-semibold
            ${value === "verification" ? "text-white" : "text-[var(--color-ink)]"}
          `}>
            Verification
          </span>
          <span className={`
            block text-sm
            ${value === "verification" ? "text-white/80" : "text-[var(--color-mute)]"}
          `}>
            Analyze a specific stock
          </span>
        </div>
        
        {/* Selection indicator for mobile card view */}
        <div className={`
          absolute right-4 top-4 h-2 w-2 rounded-full sm:hidden
          ${value === "verification" ? "bg-white" : "bg-[var(--color-border-strong)]"}
        `} />
      </button>
    </div>
  );
}
