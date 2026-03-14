"use client";

export type ResearchMode = "discovery" | "verification";

interface ModeSelectorProps {
  value: ResearchMode;
  onChange: (mode: ResearchMode) => void;
  disabled?: boolean;
}

/**
 * Differentiation anchor: a deliberate "research mode" control,
 * not a generic tab bar. Asymmetric emphasis — selected mode
 * gets weight and accent; unselected stays muted.
 */
export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Research mode"
      className="inline-flex rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-1 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "discovery"}
        aria-controls="discovery-panel"
        id="mode-discovery"
        disabled={disabled}
        onClick={() => onChange("discovery")}
        className={`
          relative rounded-md px-4 py-2.5 text-sm font-medium transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]
          disabled:cursor-not-allowed disabled:opacity-60
          ${value === "discovery"
            ? "bg-[var(--color-accent)] text-white shadow-sm"
            : "text-[var(--color-mute)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-ink)]"
          }
        `}
      >
        Discovery
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "verification"}
        aria-controls="verification-panel"
        id="mode-verification"
        disabled={disabled}
        onClick={() => onChange("verification")}
        className={`
          relative rounded-md px-4 py-2.5 text-sm font-medium transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]
          disabled:cursor-not-allowed disabled:opacity-60
          ${value === "verification"
            ? "bg-[var(--color-accent)] text-white shadow-sm"
            : "text-[var(--color-mute)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-ink)]"
          }
        `}
      >
        Verification
      </button>
    </div>
  );
}
