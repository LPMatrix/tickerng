# TickerNG

**AI-assisted equity research for the Nigerian Exchange (NGX).** Pick a mode—**Discovery** (natural language → ranked ideas) or **Verification** (ticker → structured report)—and get streamed Markdown output, saved history, PDF export, and share links.

---

## Table of contents

- [Overview](#overview)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Testing & quality](#testing--quality)
- [Production notes](#production-notes)
- [Design](#design)
- [See also](#see-also)

---

## Overview

TickerNG targets investors and researchers who want **fast, grounded** NGX coverage: web search augments each run, and reports are formatted for scanning (sections, citations context, clear verdicts). The app is **account-based** (Clerk): sign in, run research, and **persist reports** to a SQLite/Turso-compatible database.

---

## How it works

| Mode | Input | Output |
|------|--------|--------|
| **Discovery** | Free-text question or theme | Shortlist-style answer with NGX-relevant names and rationale |
| **Verification** | Single ticker (e.g. `ARADEL`) | Multi-section memo: snapshot, fundamentals, catalysts, sentiment, verdict |

Reports **stream** from the server. **Verification** runs parallel specialist passes (fundamentals, news, macro, sentiment) before a final synthesis; the UI shows progress, then renders the finished report.

---

## Architecture

```text
Browser (Next.js 15 / React 19)
    │
    ├─ Clerk (auth)
    │
    ├─ API routes (`/api/research`, `/api/reports`, …)
    │       │
    │       └─► Python agent (`/api/research-agent` on Vercel, or localhost:8788 in dev)
    │               ├─ Tavily (web search excerpts)
    │               └─ OpenRouter (LLM — streaming + specialist calls)
    │
    └─ libSQL / SQLite — saved reports & metadata
```

- **Next.js** handles UI, auth gates, quotas (e.g. verification limits), and proxies research to the agent.
- **`npm run dev`** starts **both** Next.js and the Python agent (`scripts/dev-research-agent.mjs` loads `.env.local` for the Python process).
- **Production (Vercel):** `api/research-agent.py` deploys as a Python Serverless Function. **`RESEARCH_AGENT_URL`** is optional—only if the agent runs on another host (see [Production notes](#production-notes)).

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), TypeScript |
| UI | React 19, Tailwind CSS |
| Auth | Clerk |
| Database | Drizzle ORM + libSQL (local file DB or Turso) |
| Research | Python (`api/research-agent.py`), Tavily, OpenRouter — dev uses `serve.py` on port 8788 |
| Export | Markdown rendering, jsPDF + html2canvas for PDF |

---

## Prerequisites

- **Node.js** 22+ recommended (aligned with devDependencies)
- **Python 3** on `PATH` as `python3` (or set `PYTHON_PATH` in `.env.local`)
- Accounts: [Clerk](https://clerk.com), [OpenRouter](https://openrouter.ai), [Tavily](https://tavily.com)

---

## Local setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd equiscan
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in at least **Clerk**, **OpenRouter**, and **Tavily** (see [Environment variables](#environment-variables)). Optional: Paystack for billing, Turso for a remote DB.

3. **Database**

   Default: `./data/tickerng.db` (created when the app runs). To apply the Drizzle schema to the **local file**:

   ```bash
   npm run db:push
   ```

   Plain `db:push` does **not** load `.env.local`, so it often targets local SQLite only. To apply schema to **Turso** using credentials from `.env.local`:

   ```bash
   npm run db:push:remote
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   - App: [http://localhost:3000](http://localhost:3000)
   - Research agent: `http://127.0.0.1:8788` (started by the same command)

5. **Sign in** via Clerk, open the research experience, and try **Verification** with a ticker or **Discovery** with a theme.

> **Troubleshooting:** If research returns “temporarily unavailable,” check the terminal labeled **agent** for Python errors, confirm `OPENROUTER_API_KEY` and `TAVILY_API_KEY`, and ensure nothing else is bound to port **8788**.

---

## Environment variables

| Variable | Required for local dev | Purpose |
|----------|------------------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, Clerk URLs | Yes | Authentication |
| `OPENROUTER_API_KEY` | Yes | LLM calls (via OpenRouter) |
| `TAVILY_API_KEY` | Yes | Web search in the research pipeline |
| `RESEARCH_AGENT_URL` | No | External agent origin (`POST /`). Omit locally (defaults to `serve.py`). On **Vercel**, omit unless the agent is hosted elsewhere—routing uses `/api/research-agent` automatically. |
| `RESEARCH_AGENT_PORT` | No | Dev agent port when using `serve.py` (default `8788`) |
| `DATABASE_PATH` / Turso vars | No | Override DB path or use Turso |

Full list and optional flags (Langfuse, Paystack, prompt cache): **`.env.example`**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js + Python agent (`serve.py`) via concurrently |
| `npm run dev:next` | Next.js only (start `serve.py` separately if you need research) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (Next.js config) |
| `npm test` | Vitest |
| `npm run db:push` | Drizzle **push** (uses `.env` only unless vars exported — often local SQLite) |
| `npm run db:push:remote` | Drizzle push to Turso using `.env.local` (requires `TURSO_DATABASE_URL`) |
| `npm run db:studio` | Drizzle Studio (browser UI for the configured DB; load Turso vars first if needed) |
| `npm run db:generate` | Drizzle **generate** migration SQL |

---

## Project layout

```text
src/
  app/             # Routes, layouts, API route handlers (`/api/research`, …)
  components/      # Report UI, history, export, …
  lib/             # Prompts, Tavily helpers, billing, research-agent URL resolution
api/
  research-agent.py  # Agent implementation + Vercel `handler` (POST streaming report)
  research_agent.py  # Loader shim → research-agent.py (used by serve.py)
  serve.py           # Local dev HTTP server (port 8788)
scripts/
  dev-research-agent.mjs   # Loads .env.local, runs Python serve.py
  db-push-remote.mjs       # Loads .env.local, runs drizzle-kit push against Turso
vercel.json           # e.g. maxDuration for Python function
requirements.txt      # Hint file for Python runtime (agent is stdlib-only)
pyproject.toml        # PEP 621 `[project]` — required for Vercel’s `uv lock` step
uv.lock               # Generated by `uv lock` (optional but helps reproducible builds)
```

Research responses may include headers such as `X-TickerNG-Pipeline` for debugging.

---

## Testing & quality

```bash
npm run lint
npm test
```

---

## Production notes

- **Vercel:** Set **`OPENROUTER_API_KEY`** and **`TAVILY_API_KEY`** on the project—they apply to **both** Node and the Python function. **`api/research-agent.py`** runs at **`/api/research-agent`**; **`RESEARCH_AGENT_URL`** is **not** required unless the agent is deployed separately (Railway, Fly, etc.).
- **Self-hosted Next** (`next start`, Docker): **`VERCEL_URL`** is absent—set **`RESEARCH_AGENT_URL`** to your agent’s public **`POST /`** URL.
- Configure **Clerk** production and **Turso** (or hosted libSQL) as needed.
- Long research runs depend on platform **timeouts** (`maxDuration` is configured for the research route and the Python function where supported).

---

## Design

**Editorial / terminal aesthetic** — report-first, not chat-first: warm surfaces, a single deep green accent (`#0d5c3d`), **Fraunces** for headings and **DM Sans** for UI body. The **mode switch** (Discovery | Verification) is the primary control; content reads as structured research, not a message thread.

---

## See also

- **`.env.example`** — full environment reference.
