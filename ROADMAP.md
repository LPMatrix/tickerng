# TickerNG roadmap

**Code:** `src/lib/specialists.ts`, `src/lib/tavily.ts`, `src/app/api/research/route.ts`. Response header `X-TickerNG-Pipeline: specialists-v3` for verification, `discovery` for discovery.

**Discovery:** Tavily (1–2 queries) + one streamed Claude call, no Anthropic web-search tool (macro checkbox unchanged).

**UI:** “Running specialist analysts…” until synthesis streams; then `ReportView` as before.

**Next:** Per-specialist logging/cache, SSE progress, discovery parallelization, data API on Fundamentals.

---
