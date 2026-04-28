/**
 * Base URL for the Python research agent HTTP server.
 *
 * - Development (`next dev`): defaults to http://127.0.0.1:8788 (started by `npm run dev`).
 */
export function resolveResearchAgentBase(): string | null {
  const explicit = process.env.RESEARCH_AGENT_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.NODE_ENV === "development") {
    const port = process.env.RESEARCH_AGENT_PORT ?? "8788";
    return `http://127.0.0.1:${port}`;
  }

  return null;
}
