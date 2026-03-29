# EquiScan Content (Content-Creator Skill)

This folder holds EquiScan-specific content created with the **content-creator** skill: brand voice, pillar blog post, launch social content, and a content calendar template.

## Contents

| Path | Purpose |
|------|--------|
| `brand_guidelines.md` | Voice, tone, messaging pillars, words to use/avoid. Use for all new copy. |
| `blog/how-to-verify-ngx-stock-before-investing.md` | Pillar SEO post. Publish at `/blog/how-to-verify-ngx-stock-before-investing` when you have a blog route. |
| `social/launch-x-thread.md` | X (Twitter) thread: “How I research any NGX stock in under 60 seconds.” Replace placeholders and post. |
| `social/launch-linkedin-post.md` | LinkedIn launch post. Replace [YOUR_LANDING_OR_SIGNUP_URL] and publish. |
| `content_calendar_template.md` | Monthly calendar (40/25/25/10 pillars, X + LinkedIn). Copy and fill each month. |

## Using the content-creator skill

- **Brand voice:** Before new content, skim `brand_guidelines.md` so copy matches EquiScan voice (Guide + Expert; you/your; bull/bear not buy/sell).
- **SEO:** When you add a blog route, paste the pillar post into a page or MDX. To score it: from the skill directory run  
  `python scripts/seo_optimizer.py <path-to-post> "verify NGX stock" "research Nigerian stocks,NGX stock research"`.
- **Social:** Use `launch-x-thread.md` and `launch-linkedin-post.md` as-is for launch; reuse the structure for future threads and posts.
- **Calendar:** Copy `content_calendar_template.md` to e.g. `content_calendar_2025_04.md` and fill weekly.

## Quick checklist (from skill)

Before publishing any piece:
- [ ] Matches brand voice (see `brand_guidelines.md`)
- [ ] Primary keyword in title and first 100 words (blog)
- [ ] One clear CTA
- [ ] No “buy/sell signal” language; use “bull/bear verdict”
- [ ] Proofread
