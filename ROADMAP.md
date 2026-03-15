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

### Discovery drill-down (F-07)

- Each discovery shortlist item is a link that runs a full verification report for that stock.
- No copy-paste of ticker; one click from shortlist to full report.

### Data confidence in UI (F-08)

- Prompts already ask for `[High]` / `[Medium]` / `[Low]` per section.
- Surface these in the UI (e.g. badges or labels next to section headings) so users see source confidence at a glance.

### Share / export (F-09)

- Copy report as markdown (button).
- Export as PDF.

### Macro context block (F-10)

- Optional section in discovery reports: CBN rate, inflation, FX (sourced from CBN / recent news).
- Auto-appended or toggleable in discovery mode.

### Peer share link (F-12)

- Generate a read-only URL for a specific report (e.g. `/r/[token]`).
- Share with peers without giving account access; token can be revocable or expiry-based.

---

## Later

- Report history was P2 in the PRD; implemented in v1 with DB persistence instead of localStorage.
- Future: optional NGX API or afx.kwayisi.org integration for richer data when justified.
