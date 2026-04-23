# TickerNG roadmap


## v3 (shipped) — Specialist agents + synthesis (TradingAgents-style)

**Verification (default):** Four parallel `messages.create` calls — **Fundamentals**, **News**, **Macro**, **Sentiment** — each with **Tavily** excerpts in the user message, `max_tokens: 4096`. Then one **synthesis** `messages.stream` (no search); output matches the same six-section Markdown report as v2 (through Verdict).

**Code:** `src/lib/specialists.ts`, `src/lib/tavily.ts`, `src/app/api/research/route.ts`. Response header `X-TickerNG-Pipeline: specialists-v3` for verification, `discovery` for discovery.

**Discovery:** Tavily (1–2 queries) + one streamed Claude call, no Anthropic web-search tool (macro checkbox unchanged).

**UI:** “Running specialist analysts…” until synthesis streams; then `ReportView` as before.

**Next:** Per-specialist logging/cache, SSE progress, discovery parallelization, data API on Fundamentals.

---

## Later

- Optional NGX API or afx.kwayisi.org integration for richer data when justified (can feed **Fundamentals** agent first).
