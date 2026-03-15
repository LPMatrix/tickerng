"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface ReportViewProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Enhanced Report View with improved typography,
 * structured layout, and visual indicators for key data.
 */
export function ReportView({ content, isStreaming }: ReportViewProps) {
  if (!content.trim()) return null;

  // Detect recommendation indicators in content
  const hasBuySignal = /\b(BUY|STRONG BUY)\b/i.test(content);
  const hasSellSignal = /\b(SELL|STRONG SELL)\b/i.test(content);
  const hasHoldSignal = /\b(HOLD|NEUTRAL)\b/i.test(content);

  const getRecommendationIcon = () => {
    if (hasBuySignal) return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    if (hasSellSignal) return <TrendingDown className="h-5 w-5 text-red-600" />;
    if (hasHoldSignal) return <Minus className="h-5 w-5 text-amber-600" />;
    return <AlertCircle className="h-5 w-5 text-[var(--color-mute)]" />;
  };

  return (
    <article
      className="report-content animate-fade-in"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      {/* Recommendation Badge (if detected) */}
      {(hasBuySignal || hasSellSignal || hasHoldSignal) && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
          {getRecommendationIcon()}
          <span className="text-sm text-[var(--color-mute)]">
            AI-generated recommendation detected
          </span>
        </div>
      )}

      {/* Markdown Content */}
      <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:text-[var(--color-ink)] prose-p:text-[var(--color-ink)] prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-ink)] prose-strong:font-semibold prose-table:text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-4 border-b border-[var(--color-border)] pb-3 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-6 flex items-center gap-2 text-lg font-semibold text-[var(--color-ink)]">
                <span className="h-5 w-1 rounded-full bg-[var(--color-accent)]" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-4 text-base font-semibold text-[var(--color-mute)] uppercase tracking-wide">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed text-[var(--color-ink)]">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 space-y-2 pl-5">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 space-y-2 pl-5">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-[var(--color-ink)]">
                {children}
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mb-4 border-l-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 pl-4 py-2 pr-4 italic text-[var(--color-mute)]">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="mb-6 overflow-hidden rounded-lg border border-[var(--color-border)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    {children}
                  </table>
                </div>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-[var(--color-bg)]">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="border-b border-[var(--color-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-mute)]">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-ink)]">
                {children}
              </td>
            ),
            tr: ({ children }) => (
              <tr className="transition-colors hover:bg-[var(--color-bg)]/50">
                {children}
              </tr>
            ),
            code: ({ children }) => (
              <code className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-accent)]">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-[var(--color-bg)] p-4 text-xs">
                {children}
              </pre>
            ),
            hr: () => (
              <hr className="my-6 border-[var(--color-border)]" />
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-[var(--color-ink)]">
                {children}
              </strong>
            ),
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline underline-offset-2 hover:no-underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Streaming Indicator */}
      {isStreaming && (
        <div className="mt-6 flex items-center gap-2 text-[var(--color-mute)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
          </span>
          <span className="text-sm">Generating report...</span>
        </div>
      )}
    </article>
  );
}
