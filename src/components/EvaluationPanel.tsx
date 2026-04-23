"use client";

import { useState } from "react";
import type { Evaluation } from "@/lib/evaluation";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";

const LABELS: Record<keyof Omit<Evaluation, "strengths" | "weaknesses" | "verdict" | "overallScore">, string> = {
  sourceGrounding: "Source Grounding",
  confidenceCalibration: "Confidence Calibration",
  completeness: "Completeness",
  fabricationRisk: "Fabrication Risk",
};

const VERDICT_STYLES: Record<Evaluation["verdict"], string> = {
  pass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  needs_review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  fail: "bg-red-500/10 text-red-600 border-red-500/20",
};

const VERDICT_LABELS: Record<Evaluation["verdict"], string> = {
  pass: "Pass",
  needs_review: "Needs Review",
  fail: "Fail",
};

function ScoreBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-[var(--color-mute)]">{score}/5</span>
    </div>
  );
}

interface EvaluationPanelProps {
  reportId: string;
  initialEvaluation?: Evaluation | null;
}

export function EvaluationPanel({ reportId, initialEvaluation = null }: EvaluationPanelProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(initialEvaluation);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function runEvaluation() {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/evaluate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Evaluation failed");
      }
      const data = await res.json() as Evaluation;
      setEvaluation(data);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsRunning(false);
    }
  }

  if (!evaluation && !isRunning && !error) {
    return (
      <button
        onClick={runEvaluation}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-mute)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Evaluate
      </button>
    );
  }

  if (isRunning) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-mute)]">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        Evaluating…
      </div>
    );
  }

  if (error) {
    return (
      <button
        onClick={runEvaluation}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
      >
        <FlaskConical className="h-3.5 w-3.5" />
        Retry evaluation
      </button>
    );
  }

  if (!evaluation) return null;

  const dimensionKeys = Object.keys(LABELS) as (keyof typeof LABELS)[];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-sm font-medium text-[var(--color-ink)]">Quality Evaluation</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[evaluation.verdict]}`}
          >
            {VERDICT_LABELS[evaluation.verdict]}
          </span>
          <span className="text-xs text-[var(--color-mute)]">{evaluation.overallScore}/5</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[var(--color-mute)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--color-mute)]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {dimensionKeys.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--color-mute)]">{LABELS[key]}</span>
                <ScoreBar score={evaluation[key]} />
              </div>
            ))}
          </div>

          {evaluation.strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-ink)]">Strengths</p>
              <ul className="space-y-0.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--color-mute)]">
                    + {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.weaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--color-ink)]">Weaknesses</p>
              <ul className="space-y-0.5">
                {evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-[var(--color-mute)]">
                    − {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={runEvaluation}
            className="text-xs text-[var(--color-mute)] underline-offset-2 hover:underline"
          >
            Re-run evaluation
          </button>
        </div>
      )}
    </div>
  );
}
