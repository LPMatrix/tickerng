import type { NextRequest } from "next/server";

/**
 * Resolves where POST /api/research should forward the research payload.
 *
 * - Optional `RESEARCH_AGENT_URL`: external agent origin (POST `/`). Use for Railway/Fly/etc.
 * - **Development** (`NODE_ENV === "development"`): always `http://127.0.0.1:{RESEARCH_AGENT_PORT}/` (`serve.py`),
 *   including when `VERCEL=1` from `vercel dev`. Same-origin `/api/research-agent` on the Next port often
 *   returns **404** because the Python handler is a separate process on 8788, not part of `next dev`.
 * - **Production / preview** (deployed): `{request.origin}/api/research-agent` (Python serverless on Vercel).
 */
export function resolveResearchAgentEndpoint(request: NextRequest): string | null {
  const explicit = process.env.RESEARCH_AGENT_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/`;
  }

  if (process.env.NODE_ENV === "development") {
    const port = process.env.RESEARCH_AGENT_PORT ?? "8788";
    return `http://127.0.0.1:${port}/`;
  }

  return `${request.nextUrl.origin}/api/research-agent`;
}
