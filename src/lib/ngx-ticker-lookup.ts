import manifest from "../data/ngx-listed-equities.json";

type NgxManifest = {
  generatedAt: string;
  source: string;
  count: number;
  equities: { symbol: string; companyName: string }[];
};

const data = manifest as NgxManifest;

const bySymbol = new Map<string, string>();
for (const row of data.equities) {
  bySymbol.set(row.symbol.toUpperCase(), row.companyName);
}

/**
 * Common user typos / legacy symbols → official NGX trading symbol.
 * Extend when support reports recurring mistakes.
 */
const NGX_TICKER_TYPOS: Record<string, string> = {
  ZENITH: "ZENITHBANK",
  ZENITHB: "ZENITHBANK",
  GTB: "GTCO",
  GUARANTY: "GTCO",
  "GTBANK": "GTCO",
  DANGOTE: "DANGCEM",
  DANGOT: "DANGCEM",
  MTN: "MTNN",
  SEPLAT: "SEPL",
  AIRTEL: "AIRTELAFRI",
};

/** Uppercase NGX-style symbol: collapse spaces, apply typo map. */
export function normalizeTickerCandidate(raw: string): string {
  let t = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (!t) return "";
  const mapped = NGX_TICKER_TYPOS[t];
  if (mapped) t = mapped;
  return t;
}

/** NGX tickers are short alphanumeric codes (no dots/suffixes like .L). */
export function tickerFormatLooksValid(ticker: string): boolean {
  const t = ticker.trim();
  if (t.length < 2 || t.length > 20) return false;
  return /^[A-Z0-9]+$/.test(t);
}

/** Uppercase NGX ticker → company short name, or null if not in the bundled list. */
export function resolveListedNgxTicker(ticker: string): { symbol: string; companyName: string } | null {
  const symbol = normalizeTickerCandidate(ticker);
  if (!symbol) return null;
  const companyName = bySymbol.get(symbol);
  if (!companyName) return null;
  return { symbol, companyName };
}

export function listedNgxSymbolCount(): number {
  return bySymbol.size;
}
