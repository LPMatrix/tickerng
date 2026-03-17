# SEO Audit — EquiScan

**Audit date:** 2025-03-14  
**Scope:** Technical SEO + on-page (codebase and structure). No Search Console, Analytics, or crawl data.

---

## Scope & Assumptions


| Item                 | Assumption                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Site type**        | SaaS (NGX stock research tool)                                                                 |
| **Primary SEO goal** | Signups / conversions; brand visibility for “NGX research”, “Nigerian stock research”          |
| **Target**           | Nigerian market, English                                                                       |
| **Data**             | No GSC or Analytics access; evidence from repo only                                            |
| **Focus**            | Crawlability, technical foundations, on-page optimization, content/E-E-A-T, authority/trust    |
| **Limitations**      | Core Web Vitals and indexation status not measured (no tools). Authority score is directional. |


---

## Executive Summary

EquiScan’s marketing and app structure are in place with a clear landing H1, sections, and internal links. The main gaps are: **no sitemap or robots.txt**, **one shared title/description for all routes** (including signup and shared reports), **no Open Graph/Twitter cards**, and **no privacy/terms in the footer**. Addressing these will improve crawl efficiency, SERP differentiation, and trust.

---

## SEO Health Index

- **Overall score:** 79 / 100  
- **Health status:** Good

### Category breakdown


| Category                  | Score | Weight | Weighted contribution |
| ------------------------- | ----- | ------ | --------------------- |
| Crawlability & Indexation | 72    | 30     | 21.6                  |
| Technical Foundations     | 82    | 25     | 20.5                  |
| On-Page Optimization      | 68    | 20     | 13.6                  |
| Content Quality & E-E-A-T | 92    | 15     | 13.8                  |
| Authority & Trust         | 82    | 10     | 8.2                   |
| **Total**                 | —     | 100    | **76.7 → 77**         |


*Score reflects SEO readiness from codebase review only. Rankings depend on competition and algorithm factors. Authority is not measured with backlink or real-world data.*

---

## Findings (Classification)

### 1. No XML sitemap


| Field              | Value                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | No XML sitemap exists; key indexable URLs are not declared to search engines.                                                                         |
| **Category**       | Crawlability & Indexation                                                                                                                             |
| **Evidence**       | No `sitemap.xml`, `sitemap.ts`, or `app/sitemap.ts` in repo; Next.js App Router supports `app/sitemap.ts` or `app/sitemap.xml`.                       |
| **Severity**       | Medium                                                                                                                                                |
| **Confidence**     | High                                                                                                                                                  |
| **Why it matters** | Sitemaps help discovery and prioritization of important pages (e.g. `/`, `/signup`). Without one, indexing relies only on crawling and links.         |
| **Score impact**   | −10 (Crawlability)                                                                                                                                    |
| **Recommendation** | Add `app/sitemap.ts` (or equivalent) listing canonical indexable routes (e.g. `/`, `/signup`, `/signin`) and ensure it is referenced in `robots.txt`. |


---

### 2. No robots.txt


| Field              | Value                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | No `robots.txt` in the project; no sitemap reference or crawl directives.                                                                                              |
| **Category**       | Crawlability & Indexation                                                                                                                                              |
| **Evidence**       | No `public/robots.txt` or `app/robots.ts`; no `public` folder present.                                                                                                 |
| **Severity**       | Medium                                                                                                                                                                 |
| **Confidence**     | High                                                                                                                                                                   |
| **Why it matters** | Default is “allow all”; engines still crawl. Missing sitemap reference and inability to steer crawlers (e.g. disallow `/api/`, `/research` if desired) limits control. |
| **Score impact**   | −8 (Crawlability)                                                                                                                                                      |
| **Recommendation** | Add `app/robots.ts` (Next.js 14+) or `public/robots.txt` with at least `Sitemap: <origin>/sitemap.xml` and any disallow rules for non-indexable paths.                 |


---

### 3. Shared report URLs (/r/[token]) — indexation intent unclear


| Field              | Value                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | Public share pages `/r/[token]` have no `noindex` or canonical; intent for indexation is not defined.                                                                                     |
| **Category**       | Crawlability & Indexation                                                                                                                                                                 |
| **Evidence**       | `src/app/r/[token]/page.tsx` is a client component; no `generateMetadata` or `metadata` with `robots: { index: false }`. Root layout applies same generic title/description to all pages. |
| **Severity**       | Medium                                                                                                                                                                                    |
| **Confidence**     | Medium                                                                                                                                                                                    |
| **Why it matters** | If shared reports are user-generated and numerous, they can become thin or duplicate content. If they are meant to be share-only and not rank, they should be noindex.                    |
| **Score impact**   | −10 × 0.5 (confidence) = −5 (Crawlability)                                                                                                                                                |
| **Recommendation** | Decide whether `/r/`* should be indexable. If not, add `noindex` (and optionally `nofollow`) via layout or `generateMetadata` for `/r/[token]`.                                           |


---

### 4. Single title and meta description site-wide


| Field              | Value                                                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Issue**          | Every route uses the same `<title>` and meta description from root layout: “EquiScan — NGX Research Tool” and one generic blurb.                                                                                                                                                                 |
| **Category**       | On-Page Optimization                                                                                                                                                                                                                                                                             |
| **Evidence**       | `src/app/layout.tsx` and `src/app/(marketing)/layout.tsx` both export identical `metadata`: same `title` and `description`. Signin, signup, research, and `/r/[token]` do not override.                                                                                                          |
| **Severity**       | Critical                                                                                                                                                                                                                                                                                         |
| **Confidence**     | High                                                                                                                                                                                                                                                                                             |
| **Why it matters** | SERP snippets are indistinguishable; signup/signin lose intent-specific copy; shared reports look like the homepage. This hurts CTR and relevance signals.                                                                                                                                       |
| **Score impact**   | −25 (On-Page)                                                                                                                                                                                                                                                                                    |
| **Recommendation** | Add per-route or per-section metadata: unique title/description for landing (e.g. “Full NGX stock research in under 60 seconds”), signup (“Create your free EquiScan account”), signin (“Sign in — EquiScan”), and shared report (e.g. “Shared report — EquiScan” or dynamic title from report). |


---

### 5. No Open Graph or Twitter card meta


| Field              | Value                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | No `openGraph` or `twitter` metadata; social sharing will fall back to generic title/description.                                                 |
| **Category**       | Technical Foundations                                                                                                                             |
| **Evidence**       | `metadata` in `app/layout.tsx` and `(marketing)/layout.tsx` contain only `title` and `description`. No `openGraph`, `twitter`, or `metadataBase`. |
| **Severity**       | Medium                                                                                                                                            |
| **Confidence**     | High                                                                                                                                              |
| **Why it matters** | Links shared on social and messaging get a generic preview; brand and value prop are underused.                                                   |
| **Score impact**   | −10 (Technical)                                                                                                                                   |
| **Recommendation** | Add `openGraph` and `twitter` (and `metadataBase` for absolute URLs) in root or marketing layout, at least for the landing page.                  |


---

### 6. No structured data (JSON-LD)


| Field              | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Issue**          | No Organization or WebApplication schema for the homepage or app.                                         |
| **Category**       | On-Page Optimization                                                                                      |
| **Evidence**       | No `<script type="application/ld+json">` or equivalent in layouts or landing page.                        |
| **Severity**       | Medium                                                                                                    |
| **Confidence**     | High                                                                                                      |
| **Why it matters** | Structured data can support brand panels and richer snippets; optional but beneficial for a product page. |
| **Score impact**   | −7 (On-Page)                                                                                              |
| **Recommendation** | Add JSON-LD for Organization (and optionally WebApplication) on the marketing/landing route.              |


---

### 7. No privacy or terms links in footer


| Field              | Value                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | Footer has no links to Privacy Policy or Terms of Service.                                                                                    |
| **Category**       | Authority & Trust Signals                                                                                                                     |
| **Evidence**       | Footer in `src/app/(marketing)/page.tsx` (lines 476–509) contains only copyright, “Sign in”, and “Sign up”.                                   |
| **Severity**       | High                                                                                                                                          |
| **Confidence**     | High                                                                                                                                          |
| **Why it matters** | Users and crawlers expect policy pages for a signup/product; absence can hurt trust and E-E-A-T, especially for a financial/research product. |
| **Score impact**   | −18 (Authority)                                                                                                                               |
| **Recommendation** | Add Privacy Policy and Terms of Service pages (or placeholders with “Coming soon” and a date), and link them in the footer.                   |


---

### 8. Viewport not explicitly set


| Field              | Value                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | Viewport meta is not explicitly exported from layout.                                                               |
| **Category**       | Technical Foundations                                                                                               |
| **Evidence**       | No `viewport` in `metadata` in `app/layout.tsx`. Next.js may inject a default; not overridden.                      |
| **Severity**       | Low                                                                                                                 |
| **Confidence**     | High                                                                                                                |
| **Why it matters** | If a default is applied, impact is minimal; explicit viewport is best practice for mobile-first indexing.           |
| **Score impact**   | −3 (Technical)                                                                                                      |
| **Recommendation** | Export `viewport` from root layout (e.g. `{ width: 'device-width', initialScale: 1 }`) for clarity and consistency. |


---

### 9. No author or “About” on landing


| Field              | Value                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**          | Landing page has no visible author, “About”, or last-reviewed date.                                                                                                    |
| **Category**       | Content Quality & E-E-A-T                                                                                                                                              |
| **Evidence**       | Single marketing page component; no author block or “About EquiScan” section; footer is minimal.                                                                       |
| **Severity**       | Low                                                                                                                                                                    |
| **Confidence**     | High                                                                                                                                                                   |
| **Why it matters** | E-E-A-T benefits from clear ownership and transparency, especially for a financial tool.                                                                               |
| **Score impact**   | −8 (Content/E-E-A-T)                                                                                                                                                   |
| **Recommendation** | Add a short “About” or “Why EquiScan” section and/or footer line (e.g. “Built for Nigerian retail investors”). Optional: last-reviewed or “Updated” date for the page. |


---

## What’s working

- **Landing:** Single, clear H1 (“Full NGX stock research in under 60 seconds”); logical H2s for sections (Platform, Technology, How it works, Use cases, Pricing, CTA).
- **Internal linking:** Nav links to `#features`, `#how-it-works`, `#pricing`; prominent CTAs to `/signup` and `/signin`; footer repeats sign-in/sign-up.
- **Content:** Value prop, pricing, and feature copy are clear and specific to NGX.
- **Semantic structure:** One H1 per page on landing; no duplicate H1s.
- **Auth and routing:** `/research` protected; redirect to signin when unauthenticated (no accidental indexing of app UI).
- **Language:** Root `<html lang="en">` set.

---

## Prioritized Action Plan

### 1. Critical blockers

- **Single title/description site-wide (Finding 4)**  
Implement per-route or per-section metadata so landing, signup, signin, and shared report have distinct titles and descriptions.  
**Expected score recovery:** On-Page +15–20 points.

### 2. High-impact improvements

- **No privacy/terms in footer (Finding 7)**  
Add Privacy and Terms pages (or clear placeholders) and link them in the footer.  
**Expected score recovery:** Authority +10–15.
- **No sitemap (Finding 1)**  
Add `app/sitemap.ts` (or equivalent) for indexable URLs and reference it in `robots.txt`.  
**Expected score recovery:** Crawlability +8–10.
- **No robots.txt (Finding 2)**  
Add `app/robots.ts` or `public/robots.txt` with Sitemap and any disallow rules.  
**Expected score recovery:** Crawlability +5–8.
- **No OG/Twitter (Finding 5)**  
Add `openGraph` and `twitter` (and `metadataBase`) in layout.  
**Expected score recovery:** Technical +8–10.

### 3. Quick wins

- **Viewport (Finding 8)**  
Export `viewport` from root layout.  
**Expected score recovery:** Technical +2–3.
- **Shared report indexation (Finding 3)**  
Set `noindex` for `/r/[token]` if those pages should not be indexed.  
**Expected score recovery:** Crawlability +3–5.

### 4. Longer-term opportunities

- **Structured data (Finding 6)**  
Add Organization (and optionally WebApplication) JSON-LD.  
**Expected score recovery:** On-Page +5–7.
- **E-E-A-T (Finding 9)**  
Add “About” and/or author/ownership line and optional “Updated” date.  
**Expected score recovery:** Content/E-E-A-T +5–8.

---

## Explicit Limitations

- Score is based on **codebase and structure only**; no crawl, indexation, or Core Web Vitals data.
- **Rankings** depend on competition, links, and algorithms; this audit does not predict positions.
- **Authority** is scored from trust signals in the repo (e.g. policies, footer); backlinks and real-world reputation are not assessed.

---

## Next Steps (When Remediation Is Approved)

- **programmatic-seo** — Only if you add large numbers of URLs (e.g. many static or templated pages).
- **schema-markup** — When you are ready to implement JSON-LD (Finding 6).
- **analytics-tracking** — When you want to tie SEO changes to signups and traffic.

