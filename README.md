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

1. **Install and set API key**
   ```bash
   npm install
   cp .env.example .env.local
   ```
   Add your [Anthropic API key](https://console.anthropic.com/) to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Use **Verification** with a ticker (e.g. `GTCO`, `DANGCEM`) or **Discovery** with a natural language query (e.g. "best banking stocks right now"). Reports are streamed from Claude with web search enabled.

## MVP scope (from PRD)

- Mode toggle: Discovery / Verification
- Text input per mode (ticker or natural language)
- Streamed report rendered with structured sections
- Clean, readable UI — desktop and mobile
