import type { NextRequest } from "next/server";

/**
 * Resolves where POST /api/research should forward the research payload.
 *
 * - Optional `RESEARCH_AGENT_URL`: external agent origin (POST `/`). Use for Railway/Fly/Docker sidecars/etc.
 * - **Deployed on Vercel** (`VERCEL` set + production Node build): `{origin}/api/research-agent` (Python serverless).
 * - **Everything else** (local `next dev`, `next start`, `vercel dev`): `http://127.0.0.1:{port}/` (`serve.py`).
 *   Same-origin `/api/research-agent` on the Next port is not the Python process — using it caused **404**
 *   especially for `next start` where `NODE_ENV` is production but nothing serves that route locally.
 */
export function resolveResearchAgentEndpoint(request: NextRequest): string | null {
  const explicit = process.env.RESEARCH_AGENT_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}/`;
  }

  const onVercel = Boolean(process.env.VERCEL);
  const prodNode = process.env.NODE_ENV === "production";

  if (onVercel && prodNode) {
    return `${request.nextUrl.origin}/api/research-agent`;
  }

  const port = process.env.RESEARCH_AGENT_PORT ?? "8788";
  return `http://127.0.0.1:${port}/`;
}
