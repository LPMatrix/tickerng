"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReportViewProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Renders structured report markdown with editorial typography.
 * Sections get clear hierarchy; tables and lists stay readable.
 */
export function ReportView({ content, isStreaming }: ReportViewProps) {
  if (!content.trim()) return null;

  return (
    <article
      className="report-content animate-fade-in max-w-[var(--content-max)] border-t border-[var(--color-border)] pt-[var(--space-block)]"
      aria-live="polite"
      aria-busy={isStreaming}
    >
      <div className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1>{children}</h1>,
            h2: ({ children }) => <h2>{children}</h2>,
            h3: ({ children }) => <h3>{children}</h3>,
            p: ({ children }) => <p>{children}</p>,
            ul: ({ children }) => <ul className="list-disc">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table>{children}</table>
              </div>
            ),
            th: ({ children }) => <th>{children}</th>,
            td: ({ children }) => <td>{children}</td>,
            tr: ({ children }) => <tr>{children}</tr>,
            strong: ({ children }) => <strong>{children}</strong>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {isStreaming && (
        <span
          className="mt-2 inline-block h-4 w-2 animate-pulse bg-[var(--color-accent)]"
          aria-hidden
        />
      )}
    </article>
  );
}
