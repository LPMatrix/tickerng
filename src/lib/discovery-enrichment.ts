import { generateText, type LanguageModel } from "ai";

export const MAX_DISCOVERY_ENRICHMENT_TICKERS = 5;

export function normalizeDiscoveryTicker(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length < 2 || s.length > 15) return null;
  return s;
}

export function parseTickersFromExtractionJson(text: string): string[] {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const tickers = (parsed as { tickers?: unknown }).tickers;
  if (!Array.isArray(tickers)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of tickers) {
    if (typeof item !== "string") continue;
    const n = normalizeDiscoveryTicker(item);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    if (out.length >= MAX_DISCOVERY_ENRICHMENT_TICKERS) break;
  }
  return out;
}

const TICKER_EXTRACT_SYSTEM = `You extract Nigerian Exchange (NGX) equity ticker symbols for a discovery shortlist.

Return ONLY valid JSON (no markdown fences, no commentary) in this exact shape:
{"tickers":["TICKER1","TICKER2"]}

Rules:
- 0 to 5 tickers. Uppercase letters and digits only (e.g. GTCO, DANGCEM, ZENITHBANK).
- Each ticker must plausibly match the user's question AND appear in, or be strongly implied by, the provided web excerpts (e.g. named in an article about NGX stocks).
- If excerpts do not support any specific tickers, return {"tickers":[]}.
- Do not invent tickers not grounded in the excerpts or the user query.
- Prefer liquid NGX large-caps and banks when the query is broad; still only if supported by excerpts.`;

/**
 * Lightweight pass: propose candidate tickers from initial discovery Tavily excerpts
 * before running fundamentals-style Tavily per ticker.
 */
export async function extractDiscoveryCandidateTickers(
  model: LanguageModel,
  userQuery: string,
  initialExcerptMarkdown: string
): Promise<string[]> {
  const user = `User query:\n${userQuery.trim()}\n\nWeb excerpts (may be partial):\n${initialExcerptMarkdown.slice(0, 120_000)}`;

  try {
    const { text } = await generateText({
      model,
      system: TICKER_EXTRACT_SYSTEM,
      messages: [{ role: "user", content: user }],
      maxOutputTokens: 256,
      temperature: 0,
    });
    return parseTickersFromExtractionJson(text ?? "");
  } catch {
    return [];
  }
}
