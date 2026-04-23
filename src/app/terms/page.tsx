import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service",
  description: "TickerNG terms of service — use of the NGX research tool.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent)]"
          >
            <BarChart3 className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-display text-lg font-semibold">TickerNG</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--color-mute)]">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
        <div className="prose prose-sm mt-8 max-w-none text-[var(--color-ink)]">
          <p className="text-[var(--color-mute)]">
            Our full terms of service are in preparation and will be published here soon.
          </p>
          <p className="mt-4 text-[var(--color-mute)]">
            By using TickerNG you agree that the research and reports we provide are for
            informational purposes only and do not constitute investment advice. You are responsible
            for your own investment decisions on the Nigerian Exchange.
          </p>
        </div>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to TickerNG
        </Link>
      </main>
    </div>
  );
}
