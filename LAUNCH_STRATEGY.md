# TickerNG — Launch Strategy

Structured using the **ORB framework** (Owned → Rented → Borrowed) and a **five-phase launch** so every step builds momentum and converts attention into users.

---

## Product snapshot

| | |
|---|---|
| **What** | NGX (Nigerian Exchange) research tool: Discovery (natural language → shortlist) and Verification (ticker → full report). Streamed AI reports with web search, saved in SQLite. One-click drill-down from shortlist to verification; shareable read-only links; confidence badges per section; optional macro context in discovery. |
| **Who** | Retail investors, analysts, and researchers focused on Nigerian equities who want fast, structured research without switching tools. |
| **Stage** | v1 + v2 features shipped (auth, persistence, sidebar history, **drill-down, share links, confidence UI, macro toggle**, export). “Later” roadmap: optional NGX API / afx integration. |
| **Differentiator** | Report-first “Editorial Terminal” UX, two clear modes, confidence-aware outputs, NGX-specific (not generic global screener). Share reports with peers without account access. |

---

## ORB: Channel strategy

Everything should ultimately lead back to **owned** channels.

### Owned channels (priority)

| Channel | Why for TickerNG | Start with |
|--------|-------------------|------------|
| **Email list** | Fintech/investor audience expects updates and reports; direct line for launch and feature announcements. | ✅ Primary. Collect at signup and via “Get NGX research tips” on landing. |
| **Blog / resource hub** | NGX and Nigerian markets lack quality, tool-agnostic content. You can own “how to research NGX stocks” and “what to verify before buying.” | ✅ 1–2 SEO posts (e.g. “How to verify an NGX stock before investing”, “NGX ticker symbols and where to look”). |
| **Product itself** | In-app empty states, post-report CTAs (Share link, Export), and optional email capture for report digests. | ✅ Share link and export are live — use “Share this report” and export to drive word-of-mouth. |

**Suggested first moves**

- Add email capture on landing (and optionally after first report).
- Publish one strong “how we think about NGX research” or “how to use TickerNG” post and link from README + landing.

### Rented channels (1–2 where audience is)

| Platform | Use | Tactics |
|----------|-----|--------|
| **Twitter/X** | Nigerian fintech, retail investors, some analysts. | Short threads: “How I research NGX stocks in 2 minutes”, demo GIFs, link to signup or blog. |
| **LinkedIn** | Analysts, wealth managers, institutional side. | One clear post per launch/feature: problem → TickerNG → CTA to try or join waitlist. |
| **Reddit / Nairaland** | r/Nigeria, r/NigerianInvestors, Nairaland Investing. | Provide value first (answer “how do I research NGX?”). Then soft mention: “I built a tool for this.” |

**Rule:** Use these to drive traffic to **owned** (email, blog, app). Don’t rely on algorithms as the only strategy.

### Borrowed channels (later)

- **Podcasts:** Nigerian fintech / investing shows (e.g. Nairametrics, others).
- **Newsletters:** Get featured in NGX/fintech newsletters (pitch “tool that does X” with a clear hook).
- **Communities:** Partner with investing clubs or Telegram/WhatsApp groups for a demo or early access in exchange for feedback.

---

## Five-phase launch: where you are and what’s next

| Phase | Goal | TickerNG status | Next actions |
|-------|------|------------------|--------------|
| **1. Internal** | Validate with friendly users. | ✅ Done if you’ve had a few people use it. | Optional: 2–3 more power users, fix any critical UX. |
| **2. Alpha** | First external users, controlled access. | **You are here.** | Landing + early access form; invite individuals to test; keep MVP in production. |
| **3. Beta** | Scale early access + buzz. | Next. | Work through waitlist; teasers (“Structured NGX research in one place”); “Beta” in nav; invite friends/influencers to try and share. |
| **4. Early access** | Controlled expansion. | After Beta. | Screenshots/GIFs, demos; throttle invites or open to all with “early access” framing; user research + PMF-style feedback. |
| **5. Full launch** | Self-serve, paid (if applicable), max visibility. | Later. | Open signups, announce GA, Product Hunt (if desired), all-channel push. |

**Immediate focus (Alpha → Beta)**

1. **Landing page** with value prop and email/waitlist or direct signup.
2. **Announce “TickerNG exists”** on 1–2 rented channels (e.g. Twitter + LinkedIn) with a clear CTA.
3. **Invite first 10–20 users** individually; ask for feedback and one sentence they’d use to describe the product.
4. **Add a “Beta” indicator** in the app (e.g. small label in header or nav) to set expectations.

---

## Current launch moment (post–v2 features)

You’ve just shipped **drill-down** (one-click Verify from discovery shortlist), **share links** (read-only `/r/[token]`), **confidence badges** ([High]/[Medium]/[Low] in the UI), and **macro context toggle** (include or skip CBN/inflation/FX in discovery). Per the launch-strategy matrix, this is a **medium update**: new features + UI enhancements.

**Recommended next steps**

- **One consolidated announcement** (don’t wait for a “big bang”): one email to your list (if you have one), one in-app banner or “What’s new” note, and 1–2 social posts (e.g. Twitter + LinkedIn) with a single message: *“New in TickerNG: go from discovery to full report in one click, share reports with a link, see confidence per section, and toggle macro context. Try it → [link].”*
- **Reuse the same message** in your landing page or README “Features” so new visitors see current capabilities.
- **Then continue** with Alpha/Beta as above (landing, invite 10–20 users, Beta label). The announcement gives you a concrete “we’re actively shipping” story without over-investing in a full campaign.

---

## Product Hunt (optional)

**Pros:** Tech-savvy early adopters, credibility, possible backlinks.  
**Cons:** Competitive, spikey traffic; needs prep.

**If you use it:**

- **Before:** Short demo video, clear tagline (“Structured NGX stock research in minutes”), polished screenshot/GIF; line up 2–3 supporters to upvote and comment early.
- **Day of:** Treat as all-day event; reply to every comment; point people to your site to capture email/signup.
- **After:** Follow up with commenters; add PH visitors to email list and onboarding sequence.

**Suggested tagline:**  
*“AI-powered research for Nigerian Exchange (NGX) stocks — discovery and verification in one place.”*

---

## Post-launch and ongoing launches

- **Onboarding emails:** 3–5 emails: welcome → Discovery vs Verification → “Your first report” → share link + export → ask for feedback. (Share and export are live.)
- **Roundup:** Include launch/feature news in a weekly or monthly email so people who missed the announcement see it.
- **Comparison / differentiation:** When you have traction, add a “Why TickerNG” or “vs manual research” page; reuse in rented channels.
- **Changelog:** Even small updates signal active development and build trust. Use the “Current launch moment” above as your first changelog-style announcement.

**What to announce when**

| Update type | Example | Marketing level |
|-------------|---------|------------------|
| **Major** | New product, pricing, or big pivot | Full campaign: blog, email, in-app, social. |
| **Medium** | New features (e.g. drill-down, share links, confidence badges, macro toggle) — **you are here** | One consolidated announcement: email + in-app + 1–2 posts. |
| **Minor** | UI tweaks, bug fixes | Changelog / release notes only. |

---

## Launch checklist

### Pre-launch (do first)

- [ ] **Landing page** — Clear value prop (“Structured NGX research in minutes”), who it’s for, primary CTA (Sign up / Join waitlist).
- [ ] **Email capture** — Waitlist or signup on landing; optional post–first-report capture in app.
- [ ] **Early access list** — Even 20–50 emails before “launch” helps (invite in batches).
- [ ] **Owned:** 1 blog post (e.g. “How to research NGX stocks” or “What TickerNG does”); link from README and landing.
- [ ] **Rented:** Twitter/X and LinkedIn profiles updated (bio, link to site); 1–2 posts drafted for Alpha/Beta announce.
- [ ] **Onboarding** — First-time flow clear (mode → query → report); empty state explains value.
- [ ] **Analytics** — Basic tracking: signup, first report, repeat use (e.g. Vercel Analytics or Plausible).

### Alpha / Beta launch

- [ ] **Announce** — “TickerNG is live for NGX research” (Twitter + LinkedIn); link to landing/signup.
- [ ] **Invite** — Personal invites to first 10–20 users; ask for one-sentence description and one pain point.
- [ ] **Beta label** — Visible “Beta” in app (header or nav).
- [ ] **Respond** — Reply to every comment/DM; note feature requests for v2.

### When you go “full” launch (Phase 5)

- [ ] **Blog post** — “Introducing TickerNG” or “We’re out of beta.”
- [ ] **Email** — Announce to full list.
- [ ] **In-app** — Banner or modal for existing users.
- [ ] **Social** — Schedule posts; Product Hunt if prepared.
- [ ] **Website** — Banner or notice linking to launch post.

### Post-launch

- [ ] **Onboarding sequence** — Automated emails for new signups (include share link + export in the flow).
- [ ] **Follow-up** — Thank early users; ask for a quote or case study.
- [ ] **Comparison page** — “Why TickerNG” when you have enough usage.
- [ ] **Announce new features** — Use the “Current launch moment” above: one email + in-app note + 1–2 posts for drill-down, share links, confidence badges, macro toggle.
- [ ] **Next launch** — Plan the next “launch moment” when you ship the next batch (e.g. optional NGX API integration).

---

## One-line answers for clarity

| Question | Answer |
|----------|--------|
| **What are you launching?** | TickerNG: NGX research tool — Discovery & Verification, one-click drill-down, shareable report links, confidence badges, optional macro context, export. |
| **Current stage?** | Alpha → Beta; v2 features (drill-down, share, confidence UI, macro toggle) are live — use them as your current “launch moment.” |
| **Who’s the audience?** | Nigerian retail investors, analysts, researchers who care about NGX. |
| **Owned channels to start?** | Email list + 1 blog/resource post; product (and share links) as conversion and word-of-mouth. |
| **Rented channels?** | Twitter/X + LinkedIn (announce new features + “TickerNG exists” → drive to site). |
| **Product Hunt?** | Optional; use only if you can prepare listing and supporters and treat launch day as all-day engagement. |
| **Next 7 days?** | One consolidated announcement (email + in-app + 1–2 posts) for new features; landing + email capture; “Beta” in app; invite 5–10 users by hand. |

---

*Based on the Launch Strategy skill (ORB framework, five-phase launch, Product Hunt, post-launch). Re-strategised after shipping v2 features (drill-down, share links, confidence UI, macro toggle). Adjust dates and channels to your capacity; owned channels and email should stay at the center.*
