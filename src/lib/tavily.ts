import type { SpecialistKey } from "@/lib/specialists";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

export type TavilySearchDepth = "basic" | "advanced" | "fast" | "ultra-fast";
export type TavilyTopic = "general" | "news" | "finance";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
  error?: string;
};

/** Prefer these for NGX / Nigeria equities (used with include_domains). */
export const NGX_PRIORITY_DOMAINS = [
  "ngxgroup.com",
  "nairametrics.com",
  "proshare.ng",
  "proshare.com",
  "businessday.ng",
  "businesspost.ng",
  "thecable.ng",
  "punchng.com",
  "guardian.ng",
  "vanguardngr.com",
  "thisdaylive.com",
  "premiumtimesng.com",
  "investdata.com.ng",
  "cbn.gov.ng",
  "nipc.gov.ng",
  "fmdqgroup.com",
  "sec.gov.ng",
] as const;

/** NGX & exchange sources only — for filing / disclosure retrieval. */
export const NGX_EXCHANGE_DOMAINS = ["ngxgroup.com", "fmdqgroup.com"] as const;

/** Often return homonym tickers (US/EU) instead of NGX listings. */
export const GLOBAL_TICKER_NOISE_DOMAINS = [
  "investing.com",
  "finance.yahoo.com",
  "yahoo.com",
  "marketwatch.com",
  "msn.com",
  "seekingalpha.com",
  "morningstar.com",
  "stockanalysis.com",
] as const;

export type TavilySearchOptions = {
  maxResults?: number;
  searchDepth?: TavilySearchDepth;
  topic?: TavilyTopic;
  timeRange?: "day" | "week" | "month" | "year";
  sectionHeading?: string;
  country?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
};

/**
 * Run Tavily Search and return a Markdown block suitable for appending to a user message.
 */
export async function tavilySearchToMarkdown(
  apiKey: string,
  query: string,
  options?: TavilySearchOptions
): Promise<string> {
  const trimmed = query.trim();
  const heading = options?.sectionHeading ?? "Web search excerpts";

  if (!trimmed) {
    return `## ${heading}\n\n_No query provided._\n`;
  }

  const topic = options?.topic ?? "general";
  const body: Record<string, unknown> = {
    api_key: apiKey,
    query: trimmed,
    search_depth: options?.searchDepth ?? "basic",
    max_results: Math.min(20, Math.max(1, options?.maxResults ?? 6)),
    topic,
  };

  if (options?.timeRange) body.time_range = options.timeRange;
  // Country applies to general and finance topic searches (Tavily filters by market context).
  if (options?.country && (topic === "general" || topic === "finance")) {
    body.country = options.country;
  }
  if (options?.includeDomains?.length) {
    body.include_domains = options.includeDomains.slice(0, 300);
  }
  if (options?.excludeDomains?.length) {
    body.exclude_domains = options.excludeDomains.slice(0, 150);
  }

  const res = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TavilyResponse & { message?: string };

  if (!res.ok) {
    const msg = data.error ?? data.message ?? res.statusText;
    return `## ${heading}\n\n_Search failed (${res.status}): ${msg}_\n`;
  }

  const results = data.results ?? [];
  if (results.length === 0) {
    return `## ${heading}\n\n_No results returned for this query._\n`;
  }

  const lines: string[] = [`## ${heading}`, ""];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const title = r.title?.trim() || "Untitled";
    const url = r.url?.trim() || "";
    const date = r.published_date?.trim();
    const content = (r.content ?? "").trim() || "_No snippet._";
    lines.push(`### ${i + 1}. ${title}`);
    if (url) lines.push(`Source: ${url}`);
    if (date) lines.push(`Published: ${date}`);
    lines.push(content);
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

/** "advanced" costs more; use for filing/market/sentiment-deep. Override all with TAVILY_SEARCH_DEPTH=advanced|basic. */
function tavilyDepth(phase: "filing" | "market" | "sentimentDeep" | "default"): TavilySearchDepth {
  const global = process.env.TAVILY_SEARCH_DEPTH;
  if (global === "advanced" || global === "basic") return global;
  if (global === "fast" || global === "ultra-fast") return global;
  if (phase === "filing" || phase === "market" || phase === "sentimentDeep") return "advanced";
  return "basic";
}

function narrowQuery(ticker: string, key: SpecialistKey): string {
  const t = ticker.toUpperCase();
  switch (key) {
    case "fundamentals":
      return `${t} NGX "Nigerian Stock Exchange" listed company annual report interim results IFRS audited "facts behind the figures" revenue profit EPS EBITDA dividend market cap share price naira volume doclib`;
    case "news":
      return `${t} NGX Nigeria stock dividend AGM bonus split rights issue results announcement corporate action Notices Circular`;
    case "sentiment":
      return `${t} NGX Nigeria stock analyst equity research "price target" buy hold sell consensus`;
    case "macro":
      return `${t} NGX Nigeria`;
  }
}

/**
 * NGX & company filings: targets doclib, annual/audited text where indexed.
 * Company legal name (e.g. "Lafarge") often appears in AR titles alongside ticker.
 */
function filingsExchangeQuery(ticker: string): string {
  const t = ticker.toUpperCase();
  return `${t} ("annual report" OR "interim results" OR "unaudited results" OR "audited financial" OR "full year" OR IFRS) (revenue OR "profit after tax" OR EPS OR "total assets" OR "shareholders' funds" OR "market capitalisation" OR naira) NGX "Nigerian Exchange" financial statements 2023 2024 2025`;
}

/** Price, mcap, liquidity — disambiguate from foreign homonyms. */
function marketDataQuery(ticker: string): string {
  const t = ticker.toUpperCase();
  return `"${t}" (NGX OR "Nigerian Exchange" OR "Lagos" OR "NSE:" OR naira) share price "market capitalisation" OR "market cap" "volume traded" "closing price" OR "last done" OR "YTD" equity`;
}

/** Deeper sell-side & terminal-style mentions (still web-based). */
function sentimentDeepQuery(ticker: string): string {
  const t = ticker.toUpperCase();
  return `"${t}" (Nigeria OR NGX OR "Lagos bourse" OR naira) ("equity research" OR "initiating coverage" OR "price target" OR "Earnings" OR "FY" OR "Q1" OR "Q2" OR "Q3" OR "Q4" OR "Buy" OR "Hold" OR "Sell" OR "Overweight" OR "Underweight") (analyst OR broker OR research)`;
}

/** Strong NGX disambiguation — many tickers exist on foreign venues with the same symbol. */
function wideQuery(ticker: string, key: SpecialistKey): string {
  const t = ticker.toUpperCase();
  const ngx = `(NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR "Lagos" OR ngxgroup.com OR "quoted company Nigeria" OR naira)`;
  switch (key) {
    case "fundamentals":
      return `"${t}" ${ngx} (financial statements OR "P/E" OR "P/B" OR ROE OR dividend yield OR "shares in issue" OR "market cap" OR "share price" OR "volume" OR "free float" OR "closing bid")`;
    case "news":
      return `"${t}" ${ngx} (M&A OR acquisition OR "board changes" OR CEO OR dividend OR "AGM" OR "EGM" OR 2024 OR 2025 OR 2026) stock news corporate`;
    case "sentiment":
      return `"${t}" ${ngx} (stock OR equity OR shares) (analyst OR consensus OR "research note" OR rating OR outlook) Nigeria`;
    case "macro":
      return `"${t}" ${ngx}`;
  }
}

function macroQuery(ticker: string): string {
  const t = ticker.toUpperCase();
  return `Nigeria CBN monetary policy rate MPR headline inflation naira exchange rate NGX All Share Index Nigerian capital market listed equities context for ticker ${t}`;
}

/**
 * Four parallel Tavily passes aligned with verification “fundamentals” retrieval
 * (priority sources, wide Nigeria, NGX/FMDQ filings, market/liquidity).
 * Used by specialists and by Discovery second-stage enrichment.
 */
async function fundamentalsTavilyMarkdown(apiKey: string, ticker: string): Promise<string> {
  const noise = [...GLOBAL_TICKER_NOISE_DOMAINS];
  const key: SpecialistKey = "fundamentals";
  const [narrow, wide, filings, market] = await Promise.all([
    tavilySearchToMarkdown(apiKey, narrowQuery(ticker, key), {
      topic: "finance",
      maxResults: 12,
      searchDepth: tavilyDepth("default"),
      includeDomains: [...NGX_PRIORITY_DOMAINS],
      sectionHeading: "Web search (A): NGX & Nigerian financial / news sources",
    }),
    tavilySearchToMarkdown(apiKey, wideQuery(ticker, key), {
      topic: "finance",
      country: "nigeria",
      maxResults: 12,
      searchDepth: tavilyDepth("default"),
      excludeDomains: noise,
      sectionHeading: "Web search (B): Nigeria-wide (homonym-safe query)",
    }),
    tavilySearchToMarkdown(apiKey, filingsExchangeQuery(ticker), {
      topic: "finance",
      maxResults: 15,
      searchDepth: tavilyDepth("filing"),
      includeDomains: [...NGX_EXCHANGE_DOMAINS],
      sectionHeading: "Web search (C): NGX & FMDQ — filings, reports, key figures",
    }),
    tavilySearchToMarkdown(apiKey, marketDataQuery(ticker), {
      topic: "finance",
      maxResults: 10,
      searchDepth: tavilyDepth("market"),
      country: "nigeria",
      excludeDomains: noise,
      sectionHeading: "Web search (D): market data — price, cap, volume (NGX context)",
    }),
  ]);
  return `${narrow}\n${wide}\n${filings}\n${market}`;
}

/** Per-ticker fundamentals-style Tavily bundle for Discovery (after candidate tickers are known). */
export async function buildDiscoveryTickerEnrichmentMarkdown(
  apiKey: string,
  ticker: string
): Promise<string> {
  return fundamentalsTavilyMarkdown(apiKey, ticker);
}

export async function buildSpecialistWebContext(
  apiKey: string,
  ticker: string,
  key: SpecialistKey
): Promise<string> {
  if (key === "macro") {
    return tavilySearchToMarkdown(apiKey, macroQuery(ticker), {
      topic: "general",
      country: "nigeria",
      maxResults: 10,
      searchDepth: "basic",
      excludeDomains: [...GLOBAL_TICKER_NOISE_DOMAINS],
      sectionHeading: "Web search: macro & Nigerian market context",
    });
  }

  const noise = [...GLOBAL_TICKER_NOISE_DOMAINS];
  const t = ticker.toUpperCase();

  if (key === "fundamentals") {
    return fundamentalsTavilyMarkdown(apiKey, ticker);
  }

  if (key === "news") {
    const [narrow, wide, recent] = await Promise.all([
      tavilySearchToMarkdown(apiKey, narrowQuery(ticker, key), {
        topic: "general",
        maxResults: 8,
        searchDepth: tavilyDepth("default"),
        includeDomains: [...NGX_PRIORITY_DOMAINS],
        sectionHeading: "Web search (A): NGX & Nigerian financial / news sources",
      }),
      tavilySearchToMarkdown(apiKey, wideQuery(ticker, key), {
        topic: "general",
        country: "nigeria",
        maxResults: 10,
        searchDepth: tavilyDepth("default"),
        excludeDomains: noise,
        sectionHeading: "Web search (B): Nigeria-wide (homonym-safe query)",
      }),
      tavilySearchToMarkdown(apiKey, `${t} Nigeria NGX listed company stock news`, {
        topic: "news",
        maxResults: 7,
        searchDepth: tavilyDepth("default"),
        timeRange: "month",
        excludeDomains: noise,
        sectionHeading: "Web search (C): news topic (recent)",
      }),
    ]);
    return `${narrow}\n${wide}\n${recent}`;
  }

  if (key === "sentiment") {
    const [narrow, wide, deep] = await Promise.all([
      tavilySearchToMarkdown(apiKey, narrowQuery(ticker, key), {
        topic: "general",
        maxResults: 8,
        searchDepth: tavilyDepth("default"),
        includeDomains: [...NGX_PRIORITY_DOMAINS],
        sectionHeading: "Web search (A): NGX & Nigerian financial / news sources",
      }),
      tavilySearchToMarkdown(apiKey, wideQuery(ticker, key), {
        topic: "general",
        country: "nigeria",
        maxResults: 10,
        searchDepth: tavilyDepth("default"),
        excludeDomains: noise,
        sectionHeading: "Web search (B): Nigeria-wide (homonym-safe query)",
      }),
      tavilySearchToMarkdown(apiKey, sentimentDeepQuery(ticker), {
        topic: "finance",
        maxResults: 10,
        searchDepth: tavilyDepth("sentimentDeep"),
        country: "nigeria",
        excludeDomains: noise,
        sectionHeading: "Web search (C): analyst, coverage, and rating language",
      }),
    ]);
    return `${narrow}\n${wide}\n${deep}`;
  }

  throw new Error(`unhandled specialist: ${key}`);
}

export function discoveryTavilyQueries(userQuery: string, includeMacro: boolean): string[] {
  const q = userQuery.trim();
  const primary = `${q} (NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR Lagos) listed stocks equities Nigeria`;
  if (!includeMacro) return [primary];
  return [
    primary,
    "Nigeria CBN interest rate inflation naira NGX All Share Index Nigerian stock market 2025 2026",
  ];
}

export function discoveryTavilyOptions(
  index: number
): Omit<TavilySearchOptions, "sectionHeading"> {
  return {
    maxResults: index === 0 ? 12 : 8,
    topic: "general",
    searchDepth: "basic",
    country: "nigeria",
    excludeDomains: [...GLOBAL_TICKER_NOISE_DOMAINS],
  };
}
