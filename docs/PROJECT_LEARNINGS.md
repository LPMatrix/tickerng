# Project learnings (TickerNG)

**Purpose:** Capture decisions, pitfalls, and operational knowledge discovered while building this codebase. For day-to-day setup, prefer the root `[README.md](../README.md)` and `[.env.example](../.env.example)`.

**Last updated:** 2026-05-05

---

## 1. What we are building

**TickerNG** is AI-assisted equity research for the **Nigerian Exchange (NGX)**. Users choose **Discovery** (theme → ranked ideas) or **Verification** (ticker → structured memo). Output streams as Markdown; reports persist, export to PDF, and can be shared via tokens.

---

## 2. Naming and repo layout


| Name                              | Meaning                                                   |
| --------------------------------- | --------------------------------------------------------- |
| Workspace folder `equiscan`       | Historical; local path may still say EquiScan.            |
| `package.json` `name`: `tickerng` | npm package identity.                                     |
| Product / marketing               | **TickerNG** (rebrand from **EquiScan** per git history). |
| Default DB file                   | `./data/tickerng.db`                                      |


**Takeaway:** Docs, env examples, and URLs often say `tickerng.com`; the git remote path may still be `equiscan`. When onboarding, call out the folder vs product name once to avoid confusion.

---

## 3. Architecture (validated pattern)

- **Next.js 15 (App Router) + React 19** — UI, auth, quotas, API routes that **proxy** research to the Python agent.
- **Clerk** — Session; middleware protects non-public routes; signed-in users hitting `/signin` or `/signup` redirect to `/research`.
- **Python research agent** — Tavily (search) + OpenRouter (LLM). **Verification** runs four parallel **specialists**, then a **contrarian** (bear-side) memo over those outputs only, then one **streamed synthesis**. **Discovery** uses Tavily (+ optional ticker extraction), then one streamed synthesis. Entry: `api/research-agent.py`; local dev server: `serve.py` on port **8788** (started by `npm run dev` via `scripts/dev-research-agent.mjs`).
- **Drizzle + libSQL/SQLite** — Reports, Paystack subscription rows, share tokens.
- **Paystack** — Recurring billing (Nigeria-focused ₦ pricing in docs).
- **Optional Langfuse** — Next.js OTLP via `src/instrumentation.ts` (`tickerng-next`); Python side traces and **named text prompts** when enabled. Remote prompt names include `tickerng-contrarian-system` (contrarian pass) alongside existing `tickerng-`* keys; see `api/agent/prompts/prompt_resolve.py`.

Public routes include marketing `/`, auth, `/r/*` share pages, legal, OG images, `/api/share/*`, Paystack callback, and webhooks — see `src/middleware.ts`.

---

## 4. Critical deployment and local-dev learnings

### 4.1 Where `/api/research` forwards (the big one)

Logic lives in `src/lib/research-agent-url.ts`:

- `**RESEARCH_AGENT_URL`** set → use that origin + `POST /`.
- **Vercel production** (`VERCEL` + `NODE_ENV=production`) → same request origin + `/api/research-agent` (Python **must** be deployed on that host).
- **Everything else** (local `next dev`, `next start`, `vercel dev` without the above combo) → `http://127.0.0.1:{RESEARCH_AGENT_PORT|8788}/`.

**Why it exists:** Same-origin `/api/research-agent` on the Next port is **not** the Python process locally; using it led to **404**, especially with `next start` where `NODE_ENV` is production but no Python route exists on that server.

### 4.2 Vercel: Next + Python as two services

`vercel.json` uses `**experimentalServices`**: Next at `/`, Python at `/api/research-agent` with `**maxDuration`: 300** for the agent service. That avoids App Router owning `/api/`* and returning 404 for the Python handler.

**Learnings:**

- Redeploy after changing `vercel.json`.
- Dashboard **function duration** for Python may still matter; the service block pins 300s for the research agent.
- Root `vercel.json` `functions` patterns for Python in pure Next projects are unreliable — the README explicitly warns about mismatch with Python entrypoints.

### 4.3 Clerk cookie forwarding

`/api/research` must forward `**Cookie`** (and `**Authorization`** if present) to `/api/research-agent` so the second hop passes Clerk middleware. Agent URL should use the **incoming request origin** so preview URLs and custom domains work.

### 4.4 Deployment Protection on previews

Set `**VERCEL_AUTOMATION_BYPASS_SECRET`** to match Vercel’s automation bypass so server `fetch` to `/api/research-agent` can send `**x-vercel-protection-bypass`**. Without it, protected previews can block internal server-to-server calls.

### 4.5 Timeouts

- `src/app/api/research/route.ts` exports `**maxDuration = 300`** for the Next route.
- Long streams need alignment with platform limits (documented in README).

### 4.6 Database pushes

- `npm run db:push` often uses **only** `.env`, not `.env.local` → frequently targets **local** SQLite.
- `**npm run db:push:remote`** loads `.env.local` and is the path to **Turso** when `TURSO_`* is set (`scripts/db-push-remote.mjs`).

### 4.7 Observability quirks (Langfuse)

- Next `instrumentation.ts` registers OTLP only if **both** `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are set (Basic auth for OTLP).
- In `/api/research/route.ts`, `**observe()`** does not serialize `NextRequest`/`NextResponse` well; the code uses explicit `**lfOutput`** / `updateActiveObservation` with plain objects.

### 4.8 Python / Vercel build

- `pyproject.toml` + `uv.lock` support reproducible installs; `requirements.txt` is a hint; `.vercelignore` excludes local-only `api/serve.py` from uploads.

---

## 5. NGX ticker validation (fail fast on verification)

- **Bundled list:** `data/ngx-listed-equities.json`, generated by `[scripts/seed-ngx-listed-equities.mjs](../scripts/seed-ngx-listed-equities.mjs)` (scrape / refresh when the universe changes).
- **Lookup:** `[src/lib/ngx-ticker-lookup.ts](../src/lib/ngx-ticker-lookup.ts)` maps symbols to company names; includes `**NGX_TICKER_TYPOS`** (common mistakes → official symbol) inside `**resolveListedNgxTicker`** via `**normalizeTickerCandidate`**.
- **API:** Verification requests check the list **before** calling the agent; unknown symbols return **400** with a clear message so users do not pay for a long useless run.

---

## 6. Data model insights

Defined in `src/db/schema.ts`:

- `**report`** — `mode` (`discovery` | `verification`), content, timestamps; `**deletedAt`** for **soft delete** (rows kept for audit / quota accuracy).
- `**userSubscription`** — Clerk `userId` keyed; Paystack fields; status `free` | `active` | `cancelled`.
- `**reportShare`** — Secret `token`, optional `expiresAt`, `revoked` flag; FK to report with cascade delete.

---

## 7. Product and API behaviors worth remembering

- **Verification** enforces **monthly quota** via `checkVerificationQuota` before streaming (`402` when exceeded).
- Missing `**OPENROUTER_API_KEY`** or `**TAVILY_API_KEY`** → **503** with a generic “temporarily unavailable” message (intentional; avoid leaking config state).
- Research responses may include `**X-TickerNG-Pipeline`** for debugging.

---

## 8. Verification pipeline: specialists, contrarian, synthesis

TickerNG verification is intentionally **not** a LangGraph-style multi-node trading graph. It is a **retrieve → parallel draft → adversarial critique → synthesis** pipeline, optimized for **NGX-grounded web excerpts** (Tavily with Nigeria/NGX domain bias) and a single reader-facing Markdown stream.

### 8.1 Stages (in order)

1. **Four specialists in parallel** (`api/agent/stages/verification.py`, keys in `SPECIALIST_KEYS`): fundamentals, news, macro, sentiment. Each specialist gets **its own Tavily bundle** (`api/agent/stages/specialists.py`) and **its own** blocking completion (`OPENROUTER_MODEL_SPECIALIST`), producing a scoped memo that ends with a `[High|Medium|Low]` confidence line.
2. **Contrarian pass** (single blocking completion after all specialists finish): reads **only** the four specialist memos — **no extra web search**. Prompts live in-repo as `CONTRARIAN_SYSTEM` in `api/agent/prompts/prompt_fallbacks.py`, overridable via Langfuse `tickerng-contrarian-system`. Role env: `OPENROUTER_MODEL_CONTRARIAN` (falls back to `OPENROUTER_MODEL`). Implementation: `run_contrarian()` in `verification.py`; traced as Langfuse generation name `contrarian`. Purpose: surface **cross-memo contradictions**, **missing evidence**, and the **strongest bear narrative** permitted by the excerpts — analogous to one TradingAgents-style debate voice without adopting full graph orchestration.
3. **Synthesis** (streamed): `api/agent/server/handler.py` streams OpenRouter SSE using `OPENROUTER_MODEL_SYNTHESIS`. The user payload includes XML-ish blocks for each specialist memo **plus** `<contrarian_memo>`. System prompt (`SYNTHESIS_SYSTEM` / Langfuse `tickerng-synthesis-system`) requires **§6 Verdict** with **Integrated view**, **Counter-case**, and **Bottom line**; sections 1–5 must **surface memo tensions explicitly** (no hedged one-liner collapse), and Bottom line must **weigh evidence vs contrarian**—including **explicit insufficient-signal** outcomes when memos cannot resolve bear concerns (typical on thin NGX coverage), not a default qualified Buy/Hold.

### 8.2 Design trade-offs (why this shape)


| Choice                                    | Rationale                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Contrarian **without** second Tavily pass | Bounds cost/latency; avoids retrieval noise; forces critique to cite specialist-grounded claims only.             |
| Parallel specialists                      | Maximizes breadth vs sequential LangGraph analysts; NGX-specific query/domain tuning remains in `specialists.py`. |
| Single streamed synthesis                 | One coherent Markdown artifact for PDF/UI/share; avoids exposing intermediate JSON to end users.                  |


### 8.3 Comparison anchor (TradingAgents-style graphs)

External stacks such as **TradingAgents** (LangGraph) often use **sequential tool-loop analysts**, **bull/bear rounds**, **risk personas**, **structured schemas**, and **memory/reflection over outcomes**. TickerNG trades depth there for **simpler failure modes**, **NGX retrieval focus**, and **lower orchestration surface area**. The contrarian layer captures **part** of the deliberation benefit (explicit counter-case before synthesis) without checkpointed graphs or outcome-linked memory — those remain roadmap items (`docs/AI_ARCHITECTURE_ROADMAP.md`).

---

## 9. Content and brand artifacts

Under `content/` (see `[content/README.md](../content/README.md)`): brand guidelines, pillar blog draft, launch social copy, content calendar template — aligned with TickerNG voice (e.g. bull/bear verdict language, not buy/sell signals).

---

## 10. Testing and quality

- **Vitest** — e.g. `src/lib/__tests__/billing.test.ts` for billing helpers.
- `**npm run lint`** — Next ESLint config.

---

## 11. Per-role OpenRouter model routing

The Python agent uses **role-based** `model_for(role)` (`api/agent/llm/openrouter.py`). Counts **per request**:

- **Discovery:** optional `ticker_extract` completion + **one** streamed **synthesis** (plus Tavily-only stages).
- **Verification:** **four** parallel **specialist** completions + **one** **contrarian** completion + **one** streamed **synthesis** (plus Tavily inside specialists).

Each role can override via env; all fall back to `OPENROUTER_MODEL`, then the in-code default (`anthropic/claude-sonnet-4.6`).


| Role             | Call site                                                                             | Suggested tier                               | Env override                      |
| ---------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| `ticker_extract` | `api/agent/stages/discovery.py` (JSON shortlist, 256 tok, temp 0)                     | small/cheap classifier                       | `OPENROUTER_MODEL_TICKER_EXTRACT` |
| `specialist`     | `api/agent/stages/verification.py` (4 parallel, 4096 tok each)                        | small/cheap drafter                          | `OPENROUTER_MODEL_SPECIALIST`     |
| `contrarian`     | `api/agent/stages/verification.py` (after specialists, 3072 tok max; memo-only input) | same tier as specialist or slightly stronger | `OPENROUTER_MODEL_CONTRARIAN`     |
| `synthesis`      | `api/agent/server/handler.py` (final stream, 8192 tok)                                | large reasoning model                        | `OPENROUTER_MODEL_SYNTHESIS`      |


Resolver: `agent.llm.openrouter.model_for(role)`. Both `openrouter_generate` and `openrouter_stream_generate` accept an optional `model=` kwarg; Langfuse generation labels (`final_stream_generation`, `threaded_generation`, specialist/contrarian threaded spans, and the `discovery.ticker-extract` observation) receive the resolved model.

Practical example: run specialists **and** contrarian on a cheaper default while reserving the large model for synthesis:

```env
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_MODEL_SYNTHESIS=anthropic/claude-sonnet-4.6
```

If none of the per-role vars are set, every stage shares `OPENROUTER_MODEL`.

---

## 12. When to update this file

Update when you:

- Change how the research agent is reached (new host, path, or env var).
- Alter Vercel Services layout or timeouts.
- Add a new integration that needs shared secrets or bypass headers.
- Change NGX listing validation, bundled data, or verification quotas.
- Discover a new production-only failure mode (previews, cookies, DB env loading).
- Change verification stages (specialists, contrarian, synthesis prompts, or OpenRouter roles).

---

## See also

- `[README.md](../README.md)` — setup, scripts, production checklist.
- `[.env.example](../.env.example)` — full variable list and comments.
- `[vercel.json](../vercel.json)` — `experimentalServices` definition.
- `[AI_ARCHITECTURE_ROADMAP.md](./AI_ARCHITECTURE_ROADMAP.md)` — phased recommendations for research-agent improvements.

