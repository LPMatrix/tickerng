# EquiScan roadmap

## v1 (current)

- Mode toggle: Discovery / Verification
- Text input per mode (ticker or natural language)
- Streamed report from Claude with web search
- Auth (sign up / sign in) and SQLite-backed user storage
- Report persistence: reports saved to SQLite and listed in Recent reports
- Clean, readable UI — desktop and mobile

---

## v2 (planned)

### Discovery drill-down (F-07) — implemented

- Each discovery shortlist item is a link that runs a full verification report for that stock.
- No copy-paste of ticker; one click from shortlist to full report.
- **Done:** Shortlist entries matching `**Name (TICKER)**` show a "Verify" button; clicking runs verification for that ticker.

### Data confidence in UI (F-08) — implemented

- Prompts already ask for `[High]` / `[Medium]` / `[Low]` per section.
- Surface these in the UI (e.g. badges or labels next to section headings) so users see source confidence at a glance.
- **Done:** Paragraphs that are exactly `[High|Medium|Low] — reason` render as coloured confidence badges + reason text.

### Macro context block (F-10) — implemented

- Optional section in discovery reports: CBN rate, inflation, FX (sourced from CBN / recent news).
- Auto-appended or toggleable in discovery mode.
- **Done:** Discovery form has "Include macro context (CBN rate, inflation, FX)" checkbox (default on); prompt omits Macro Context section when unchecked.

### Peer share link (F-12) — implemented

- Generate a read-only URL for a specific report (e.g. `/r/[token]`).
- Share with peers without giving account access; token can be revocable or expiry-based.
- **Done:** Share button on report creates link; public `/r/[token]` page; optional expiry via `expiresInDays`; `DELETE /api/share/[token]` to revoke.

---

## Later

- Future: optional NGX API or afx.kwayisi.org integration for richer data when justified.
