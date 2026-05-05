# AI architecture roadmap (TickerNG research agent)

**Purpose:** Prioritized recommendations beyond the current **specialists → contrarian → synthesis** verification pipeline. For how the stack works today, see **[PROJECT_LEARNINGS.md §8](./PROJECT_LEARNINGS.md)**.

**Last updated:** 2026-05-05

**Principles:**

- Preserve **NGX-first retrieval** (Tavily domain/query tuning in `api/agent/stages/specialists.py`) as the primary ground-truth path for Nigerian listings.
- Prefer **small, measurable increments** over importing a full LangGraph trading stack unless product scope expands to multi-session portfolios and outcome tracking.
- Keep **one streamed Markdown artifact** for the product unless UX explicitly adopts structured widgets.

---

## Done (baseline)


| Item                 | Notes                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Parallel specialists | Four lenses + Tavily; `OPENROUTER_MODEL_SPECIALIST`.                                                        |
| Contrarian pass      | Memo-only critique after specialists; `OPENROUTER_MODEL_CONTRARIAN`; Langfuse `tickerng-contrarian-system`. |
| Verdict structure    | Synthesis must include Integrated view / Counter-case / Bottom line under §6 Verdict.                       |


---

## Phase A — Structured machine-readable verdict (high leverage, low orchestration)

**Goal:** Preserve Markdown for humans while adding a **parseable signal** for analytics, filtering, and export — similar to TradingAgents’ parsed rating line but without a graph.

**Recommendations:**

1. **Append or embed JSON** — After streaming Markdown, emit a final fenced block or trailing JSON object `{ "stance": "...", "confidence": "...", "horizon": "...", "key_risks": [] }` validated with a tight schema (or run a **small second completion** that outputs JSON-only from the same context — trade latency for reliability).
2. **Persist alongside report** — Optional column or JSON blob on `report` for verified searches and Mail/Product hooks.
3. **Contracts tests** — Snapshot tests on synthetic specialist/contrarian payloads to ensure the synthesis prompt keeps producing required §6 subsections.

**Effort:** Small–medium. **Risk:** Schema drift; mitigate with CI snapshots.

---

## Phase B — Second adversarial persona (optional depth)

**Goal:** Approximate multi-agent **risk committees** without full graphs.

**Recommendations:**

1. **Risk-officer pass** — After contrarian (or in parallel with contrarian), a specialist focused only on **liquidity, disclosure gaps, regulatory/CBN sensitivity**, consuming the same four memos only.
2. **Merge in synthesis** — Extend §6 or add §5.5 “Risk desk view”; keep one stream.

**Effort:** Medium (+1 blocking completion per verification). **Mitigation:** Gate behind env `VERIFICATION_RISK_PASS_ENABLED` if cost-sensitive.

---

## Phase C — Contrarian-grounded retrieval (when meme-only critique is thin)

**Goal:** Let bear-side arguments cite **fresh** negatives without exploding scope like arbitrary tool loops.

**Recommendations:**

1. **Targeted Tavily queries** — Small fixed set (e.g. “{ticker} NGX suspension”, “{ticker} lawsuit Nigeria”, “{ticker} rights issue”) merged into contrarian user payload only.
2. **Budget** — Cap results (e.g. 6–8 snippets) and reuse existing NGX noise filters.

**Effort:** Medium (prompt + query helpers + tracing). **Risk:** Higher hallucination if snippets are noisy; keep “memo-grounded first” as default.

---

## Phase D — Lightweight outcome memory (power-user / B2B prep)

**Goal:** Echo TradingAgents-style **reflection** without adopting LangGraph.

**Recommendations:**

1. **Append-only decision log** — Store ticker, date, verdict summary hash, optional user notes.
2. **Optional price check job** — Cron or on-demand fetch for simple benchmark comparison (NGX index / peer); attach **realized stub** to Langfuse or DB for analyst trust metrics.
3. **Prompt injection** — For returning users, pass **prior verdict bullets** into synthesis context (bounded tokens).

**Effort:** Medium–large (schema, privacy, correctness disclaimers).

---

## Phase E — Tool-using analysts (only if Tavily ceilings hard)

**Goal:** Numeric precision (clean prices, ratios) when web excerpts stay stale.

**Recommendations:**

1. **Deterministic tools first** — Official NGX/FMDQ endpoints or licensed market data APIs wrapped as Python functions; **no** open-ended browsing.
2. **Optional LangGraph subgraph** — Isolate tool-loop **per analyst** behind a feature flag if sequential refinement proves necessary.

**Effort:** Large (compliance, keys, retries). **Defer** until product validates demand.

---

## Phase F — Discovery parity

**Goal:** Discovery runs remain synthesis-only after retrieval; consider **shortlist rationale + per-ticker tension** similar to verification.

**Recommendations:**

1. **Mini-contrarian per shortlist ticker** — Only for top N names (cost cap).
2. **Or** single “sceptic” pass over the whole discovery excerpt bundle before synthesis.

**Effort:** Small–medium.

---

## What we are **not** recommending (yet)

- **Full TradingAgents clone** (sequential tool analysts, bull/bear debate graph, checkpoints) unless TickerNG becomes a **portfolio / backtest** product — operational cost and debugging surface dominate.
- **Replacing Tavily with generic agents** for NGX — domain-tuned retrieval remains a differentiator.

---

## Suggested sequencing

1. **Phase A** — Structured verdict + tests ( measurable uplift for product analytics ).
2. **Phase B or C** — Choose **risk officer** if narratives feel shallow; choose **contrarian retrieval** if negatives are systematically missed.
3. **Phase D** — Once retention / “same ticker again” workflows matter.
4. **Phase E** — Data-licensing clarity required.

---

## See also

- **[PROJECT_LEARNINGS.md](./PROJECT_LEARNINGS.md)** — deployment, routing, §8 pipeline detail, OpenRouter roles.
- `**api/agent/prompts/prompt_fallbacks.py`** — canonical prompt text when Langfuse is off.