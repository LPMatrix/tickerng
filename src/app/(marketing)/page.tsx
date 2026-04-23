import Link from "next/link";
import { 
  Search, 
  FileCheck, 
  Zap, 
  Shield, 
  BarChart3, 
  Clock,
  ArrowRight,
  CheckCircle2,
  Database,
  Lock,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              TickerNG
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-sm font-medium text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link 
              href="/signin" 
              className="hidden text-sm font-medium text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors md:block"
            >
              Sign in
            </Link>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-4 py-1.5 text-sm text-[var(--color-accent)] mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Now with AI-powered research reports</span>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-6xl lg:text-7xl">
            Full NGX stock research{" "}
            <span className="text-[var(--color-accent)]">in under 60 seconds</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-mute)] md:text-xl">
            Your personal NGX analyst, on demand. Discovery and verification reports powered by AI — discover opportunities or deep-dive any ticker on the Nigerian Exchange.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-8 py-4 text-base font-medium text-white hover:bg-[var(--color-accent)]/90 transition-all hover:scale-[1.02]"
            >
              Start researching free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="#features" 
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-8 py-4 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface)]/80 transition-all"
            >
              See how it works
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-[var(--color-mute)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Free tier available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="features" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Platform
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Two powerful research modes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-mute)]">
              Whether you&apos;re exploring new opportunities or analyzing a specific stock, TickerNG gives you the tools to make informed decisions.
            </p>
          </div>

          {/* Discovery Mode */}
          <div className="mb-24 grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 shadow-sm">
                <div className="overflow-hidden rounded-xl bg-[var(--color-surface)]">
                  <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                      <div className="h-3 w-3 rounded-full bg-green-400/80" />
                      <span className="ml-4 text-xs text-[var(--color-mute)]">Discovery Mode</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                      <p className="text-sm text-[var(--color-mute)]">What are the best dividend-paying stocks in the banking sector?</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4">
                        <Search className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">GTCO - Guaranty Trust Holding</p>
                          <p className="text-xs text-[var(--color-mute)]">Strong dividend history, 8.5% yield</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                        <Search className="mt-0.5 h-4 w-4 text-[var(--color-mute)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">ZENITHBANK - Zenith Bank</p>
                          <p className="text-xs text-[var(--color-mute)]">Consistent payout ratio, 7.2% yield</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[var(--color-ink)] md:text-3xl">
                Discovery Mode
              </h3>
              <p className="mt-4 text-lg text-[var(--color-mute)]">
                Ask natural language questions about the Nigerian market and get a curated shortlist of stocks that match your criteria.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Find stocks by sector, metrics, or strategy",
                  "Filter by dividend yield, P/E ratio, market cap",
                  "Get contextual insights with each result"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--color-ink)]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verification Mode */}
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[var(--color-ink)] md:text-3xl">
                Verification Mode
              </h3>
              <p className="mt-4 text-lg text-[var(--color-mute)]">
                Enter any NGX ticker symbol and receive a comprehensive, structured research report with key metrics and analysis.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Full financial health assessment",
                  "Valuation analysis with key ratios",
                  "Risk factors and growth catalysts",
                  "Executive summary with bull/bear case verdict"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--color-ink)]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 shadow-sm">
                <div className="overflow-hidden rounded-xl bg-[var(--color-surface)]">
                  <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                      <div className="h-3 w-3 rounded-full bg-green-400/80" />
                      <span className="ml-4 text-xs text-[var(--color-mute)]">Verification Mode — DANGCEM</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-sm">
                        DAN
                      </div>
                      <div>
                        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Dangote Cement</p>
                        <p className="text-xs text-[var(--color-mute)]">NGX: DANGCEM</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="font-medium text-[var(--color-accent)]">Bull case</p>
                        <p className="text-xs text-[var(--color-mute)]">Verdict</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                        <p className="text-xs text-[var(--color-mute)]">P/E Ratio</p>
                        <p className="font-medium text-[var(--color-ink)]">12.4x</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                        <p className="text-xs text-[var(--color-mute)]">Div Yield</p>
                        <p className="font-medium text-[var(--color-accent)]">6.2%</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                        <p className="text-xs text-[var(--color-mute)]">Market Cap</p>
                        <p className="font-medium text-[var(--color-ink)]">₦5.2T</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology/Trust Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Technology
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Built for reliable research
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "AI-Powered Analysis",
                description: "Advanced language models process and synthesize financial data to generate insightful reports in seconds."
              },
              {
                icon: <Database className="h-6 w-6" />,
                title: "Structured Reports",
                description: "Consistent, sectioned reports with clear hierarchy — no more scattered notes or inconsistent analysis."
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Your Data, Secure",
                description: "All research history is private to your account. We never share your search patterns or portfolio interests."
              }
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[var(--color-mute)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
              How it works
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Research in three simple steps
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your mode",
                description: "Select Discovery for exploratory research or Verification for deep analysis on a specific stock."
              },
              {
                step: "02",
                title: "Enter your query",
                description: "Type a natural language question or enter a ticker symbol — our AI understands both."
              },
              {
                step: "03",
                title: "Get your report",
                description: "Receive a structured, comprehensive report with citations and key insights in seconds."
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="mb-4 font-display text-5xl font-bold text-[var(--color-accent)]/20">
                  {item.step}
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[var(--color-mute)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Use cases
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              For every type of investor
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: "Fundamental Analysis",
                description: "Dive deep into company financials with automated ratio analysis, trend identification, and comparative benchmarking against sector peers."
              },
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Dividend Screening",
                description: "Find high-yield opportunities with sustainable payout ratios. Perfect for income-focused investors in the Nigerian market."
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: "Risk Assessment",
                description: "Understand potential downsides with comprehensive risk factor analysis and sensitivity to macroeconomic conditions."
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "Quick Validation",
                description: "Verify investment ideas in minutes instead of hours. Get a second opinion on stocks you're considering."
              }
            ].map((useCase) => (
              <div 
                key={useCase.title} 
                className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-sm"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {useCase.icon}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-mute)]">
                    {useCase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Pricing
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-mute)]">
              The value of structured NGX research is obvious after a few reports — start free, then
              go unlimited when you’re ready.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">Free</h3>
                <p className="mt-1 text-3xl font-semibold text-[var(--color-ink)]">
                  $0
                  <span className="text-base font-normal text-[var(--color-mute)]"> / month</span>
                </p>
              </div>
              <ul className="space-y-3 text-[var(--color-ink)]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                  <span>
                    <strong className="font-medium text-[var(--color-ink)]">3 Verification reports</strong> per
                    month (full ticker deep-dives, resets monthly)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                  <span>Unlimited Discovery — natural-language screening and shortlists</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                  <span>Saved report history, shareable read-only links, export PDF &amp; Markdown</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-3 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-bg)]"
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="relative isolate">
              <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-surface)] px-3 py-0.5 text-xs font-medium text-[var(--color-accent)] shadow-sm">
                Pro
              </span>
              <div className="relative z-0 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-bg)] p-8 pt-6 shadow-md">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-[var(--color-ink)]">Unlimited</h3>
                  <p className="mt-1 text-3xl font-semibold text-[var(--color-ink)]">
                    $15
                    <span className="text-base font-normal text-[var(--color-mute)]"> / month</span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-mute)]">
                    Unlimited verification reports (and everything in Free), for active researchers.
                  </p>
                </div>
                <ul className="space-y-3 text-[var(--color-ink)]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>
                      <strong className="font-medium text-[var(--color-ink)]">Unlimited</strong> Verification
                      reports — no monthly cap
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>All Discovery, history, sharing, and export features from Free</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent)]/90"
                >
                  Get unlimited
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[var(--color-accent)] px-8 py-16 text-center md:px-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Start researching smarter today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Join investors who use TickerNG to make better decisions on the Nigerian Exchange.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-medium text-[var(--color-accent)] hover:bg-white/90 transition-all hover:scale-[1.02]"
            >
              Create free account
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/signin" 
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-medium text-white hover:bg-white/20 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                TickerNG
              </span>
            </div>
            <p className="text-sm text-[var(--color-mute)]">
              © {new Date().getFullYear()} TickerNG. Research tool for the Nigerian Exchange.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
                Terms
              </Link>
              <Link href="/signin" className="text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="text-sm text-[var(--color-mute)] hover:text-[var(--color-ink)] transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
