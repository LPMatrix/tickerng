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


| Mode             | Input                         | Output                                                                    |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------- |
| **Discovery**    | Free-text question or theme   | Shortlist-style answer with NGX-relevant names and rationale              |
| **Verification** | Single ticker (e.g. `ARADEL`) | Multi-section memo: snapshot, fundamentals, catalysts, sentiment, verdict |


Reports **stream** from the server (SSE). **Verification** runs parallel specialist passes (fundamentals, news, macro, sentiment) before a final synthesis; the UI shows progress, then renders the finished report.

---

## Architecture

```text
Browser (Next.js 15 / React 19)
    │
    ├─ Clerk (auth)
    │
    ├─ API routes (`/api/research`, `/api/reports`, …)
    │       │
    │       └─► Python research agent (HTTP, default :8788)
    │               ├─ Tavily (web search excerpts)
    │               └─ OpenRouter (LLM — streaming + specialist calls)
    │
    └─ libSQL / SQLite — saved reports & metadata
```

- **Next.js** handles UI, auth gates, quotas (e.g. verification limits), and proxies research to the agent.
- `**npm run dev`** starts **both** Next.js and the Python agent (`scripts/dev-research-agent.mjs` loads `.env.local` for the Python process).
- **Production:** deploy the Next app as usual; the research agent must be reachable and `**RESEARCH_AGENT_URL`** must point to it (see [Production notes](#production-notes)).

---

## Stack


| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js (App Router), TypeScript                                    |
| UI        | React 19, Tailwind CSS                                              |
| Auth      | Clerk                                                               |
| Database  | Drizzle ORM + libSQL (local file DB or Turso)                       |
| Research  | Python 3 (`api/serve.py` → `research_agent.py`), Tavily, OpenRouter |
| Export    | Markdown rendering, jsPDF + html2canvas for PDF                     |


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
   Fill in at least **Clerk**, **OpenRouter**, and **Tavily** (see table below). Optional: Paystack for billing, Turso for a remote DB.
3. **Database**
  Default: `./data/tickerng.db` (created when the app runs). To apply the Drizzle schema explicitly:
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


| Variable                                                            | Required for local dev                       | Purpose                             |
| ------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, Clerk URLs | Yes                                          | Authentication                      |
| `OPENROUTER_API_KEY`                                                | Yes                                          | LLM calls (via OpenRouter)          |
| `TAVILY_API_KEY`                                                    | Yes                                          | Web search in the research pipeline |
| `RESEARCH_AGENT_URL`                                                | No (dev defaults to `http://127.0.0.1:8788`) | Override agent base URL             |
| `RESEARCH_AGENT_PORT`                                               | No                                           | Dev agent port (default `8788`)     |
| `DATABASE_PATH` / Turso vars                                        | No                                           | Override DB location or use Turso   |


Full list and optional flags (Langfuse, Paystack, prompt cache): `**.env.example`**.

---

## Scripts


| Command                           | Description                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                     | Next.js + Python research agent (concurrent)                         |
| `npm run dev:next`                | Next.js only (agent must be started separately if you need research) |
| `npm run build` / `npm start`     | Production build and server                                          |
| `npm run lint`                    | ESLint (Next.js config)                                              |
| `npm test`                        | Vitest                                                               |
| `npm run db:push` / `db:generate` | Drizzle migrations / generate SQL                                    |


---

## Project layout

```text
src/
  app/           # Routes, layouts, API route handlers
  components/    # Report UI, history, export, etc.
  lib/           # Prompts, Tavily helpers, billing, agent URL resolution
api/
  serve.py           # Dev HTTP server → loads research_agent.py
  research_agent.py  # Agent handler (OpenRouter + Tavily)
```

Research response headers include pipeline hints (e.g. `X-TickerNG-Pipeline`) for debugging.

---

## Testing & quality

```bash
npm run lint
npm test
```

Add or extend tests under the Vitest setup as features grow.

---

## Production notes

- Set `**RESEARCH_AGENT_URL**` to your deployed Python agent’s public HTTPS URL (no default in production).
- Configure **Clerk** production instance and **Turso** (or hosted libSQL) as needed.
- Ensure long-running research requests fit your host’s **timeout** limits (the research route uses an extended `maxDuration` where supported).

---

