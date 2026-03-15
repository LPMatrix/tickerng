# EquiScan — NGX Research Tool

Fast, structured stock research on the Nigerian Exchange (NGX). Two modes: **Discovery** (natural language → shortlist of stocks) and **Verification** (ticker → full report).

## Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI:** Claude API (to be wired in)
- **Deploy:** Vercel

## Design (Frontend Design Skill)

**Aesthetic:** Editorial Terminal — report-first, trustworthy, data-dense.

- **Direction:** One dominant surface (warm off-white / dark surface), one accent (deep green `#0d5c3d`), one neutral system. No purple gradients or generic SaaS palette.
- **Typography:** Fraunces (display/sections) + DM Sans (body/UI). No Inter/Roboto.
- **Differentiation:** Mode selector is the primary control — Discovery | Verification with clear selected state and asymmetric emphasis. Reports use strong serif section hierarchy, not chat bubbles.
- **DFII:** High context fit (financial research), high feasibility, consistent spacing and motion (one entrance animation, purposeful hover).
- **This avoids generic UI by:** Using a deliberate research-mode control instead of hidden tabs; report-first layout with section hierarchy instead of a chat interface; and a single accent with warm neutrals instead of default Tailwind/ShadCN layouts.

## Run locally

1. **Install and set env**
   ```bash
   npm install
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   - `ANTHROPIC_API_KEY` — [Anthropic API key](https://console.anthropic.com/)
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`

2. **Database**  
   SQLite DB is created at `./data/equiscan.db` on first run. Tables are created automatically. Optional: run `npm run db:push` after installing (requires `better-sqlite3` native build).

3. **Start dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to **Sign in**; use **Sign up** to create an account, then sign in. After that you can run **Verification** (ticker) or **Discovery** (natural language) and get streamed reports.

## MVP scope (from PRD)

- Mode toggle: Discovery / Verification
- Text input per mode (ticker or natural language)
- Streamed report rendered with structured sections
- Auth, SQLite, and report persistence (saved reports + Recent list below header)
- Clean, readable UI — desktop and mobile

See **[ROADMAP.md](./ROADMAP.md)** for v2 plans (drill-down, confidence UI, export, share link, macro context).
