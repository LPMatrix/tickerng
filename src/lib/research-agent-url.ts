import type { NextRequest } from "next/server";

/**
 * Resolves where POST /api/research should forward the research payload.
 *
 * - Optional `RESEARCH_AGENT_URL`: external agent origin (POST `/`). Use for Railway/Fly/etc.
 * - Vercel (preview/production or `vercel dev`): same-deployment Python at `{request.origin}/api/research-agent`.
 *   Using the **incoming request origin** keeps Clerk cookies aligned (preview URLs, custom domains).
 * - Local `next dev` (no `VERCEL`): `http://127.0.0.1:8788/` (`serve.py`).
 */
export function resolveResearchAgentEndpoint(request: NextRequest): string | null {
  const explicit = process.env.RESEARCH_AGENT_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/`;
  }

  const onVercel = Boolean(process.env.VERCEL);
  if (process.env.NODE_ENV === "development" && !onVercel) {
    const port = process.env.RESEARCH_AGENT_PORT ?? "8788";
    return `http://127.0.0.1:${port}/`;
  }

  return `${request.nextUrl.origin}/api/research-agent`;
}
