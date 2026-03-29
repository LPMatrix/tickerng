# EquiScan roadmap


## v3 (shipped) — Specialist agents + synthesis (TradingAgents-style)

**Verification (default):** Four parallel `messages.create` calls with web search — **Fundamentals**, **News**, **Macro**, **Sentiment** — each `max_uses: 4`, `max_tokens: 4096`. Then one **synthesis** `messages.stream` with **no** web search; output matches the same six-section Markdown report as v2 (through Verdict).

**Code:** `src/lib/specialists.ts`, `src/app/api/research/route.ts`. Response header `X-EquiScan-Pipeline: specialists-v3` for verification, `discovery` for discovery.

**Discovery:** One streamed call + web search (macro checkbox unchanged).

**UI:** “Running specialist analysts…” until synthesis streams; then `ReportView` as before.

**Next:** Per-specialist logging/cache, SSE progress, discovery parallelization, data API on Fundamentals.

---

## Later

- Optional NGX API or afx.kwayisi.org integration for richer data when justified (can feed **Fundamentals** agent first).
