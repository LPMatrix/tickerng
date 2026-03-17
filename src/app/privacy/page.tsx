import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy",
  description: "EquiScan privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-ink)] hover:text-[var(--color-accent)]"
          >
            <BarChart3 className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-display text-lg font-semibold">EquiScan</span>
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--color-mute)]">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
        <div className="prose prose-sm mt-8 max-w-none text-[var(--color-ink)]">
          <p className="text-[var(--color-mute)]">
            Our full privacy policy is in preparation. We are committed to protecting your data and
            will publish a complete policy here soon.
          </p>
          <p className="mt-4 text-[var(--color-mute)]">
            In the meantime: we do not sell your personal information. Research history and account
            data are stored securely and used only to provide and improve EquiScan. You can delete
            your account at any time.
          </p>
        </div>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to EquiScan
        </Link>
      </main>
    </div>
  );
}
