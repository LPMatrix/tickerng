/**
 * Resolves where POST /api/research should forward the research payload.
 *
 * - Optional `RESEARCH_AGENT_URL`: external agent origin (POST `/`). Use for Railway/Fly/etc.
 * - Vercel (preview/production): same-deployment Python serverless function at `/api/research-agent`.
 * - Local `next dev`: standalone agent from `npm run dev` → `http://127.0.0.1:8788/` (serve.py).
 *
 * `vercel dev` sets `VERCEL` so we target `/api/research-agent` instead of localhost.
 */
export function resolveResearchAgentEndpoint(): string | null {
  const explicit = process.env.RESEARCH_AGENT_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/`;
  }

  const onVercel = Boolean(process.env.VERCEL);
  if (process.env.NODE_ENV === "development" && !onVercel) {
    const port = process.env.RESEARCH_AGENT_PORT ?? "8788";
    return `http://127.0.0.1:${port}/`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const local =
      vercelUrl.startsWith("localhost") || vercelUrl.startsWith("127.0.0.1");
    const origin = `${local ? "http" : "https"}://${vercelUrl}`;
    return `${origin}/api/research-agent`;
  }

  return null;
}
