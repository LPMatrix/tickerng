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
  "punchng.com",
  "guardian.ng",
  "vanguardngr.com",
  "thisdaylive.com",
  "premiumtimesng.com",
  "investdata.com.ng",
  "cbn.gov.ng",
  "nipc.gov.ng",
] as const;

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
  if (options?.country && topic === "general") body.country = options.country;
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

function narrowQuery(ticker: string, key: string): string {
  const t = ticker.toUpperCase();
  switch (key) {
    case "fundamentals":
      return `${t} NGX Nigerian Stock Exchange listed company annual report interim results revenue profit EPS market cap share price volume`;
    case "news":
      return `${t} NGX Nigeria stock dividend AGM bonus split results announcement corporate action`;
    case "sentiment":
      return `${t} NGX Nigeria stock analyst equity research buy hold sell target price`;
    default:
      return `${t} NGX Nigeria`;
  }
}

/** Strong NGX disambiguation — many tickers exist on foreign venues with the same symbol. */
function wideQuery(ticker: string, key: string): string {
  const t = ticker.toUpperCase();
  const ngx = `(NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR "Lagos" OR ngxgroup.com OR "quoted company Nigeria")`;
  switch (key) {
    case "fundamentals":
      return `"${t}" ${ngx} stock market capitalisation financial statements P/E P/B earnings shares traded`;
    case "news":
      return `"${t}" ${ngx} stock news earnings dividend AGM 2025 2026`;
    case "sentiment":
      return `"${t}" ${ngx} stock analyst report rating research Nigeria`;
    default:
      return `"${t}" ${ngx}`;
  }
}

function macroQuery(ticker: string): string {
  const t = ticker.toUpperCase();
  return `Nigeria CBN monetary policy rate MPR headline inflation naira exchange rate NGX All Share Index Nigerian capital market listed equities context for ticker ${t}`;
}

export async function buildSpecialistWebContext(
  apiKey: string,
  ticker: string,
  key: string
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

  if (key === "news") {
    const [narrow, wide, recent] = await Promise.all([
      tavilySearchToMarkdown(apiKey, narrowQuery(ticker, key), {
        topic: "general",
        maxResults: 8,
        searchDepth: "basic",
        includeDomains: [...NGX_PRIORITY_DOMAINS],
        sectionHeading: "Web search (A): NGX & Nigerian financial / news sources",
      }),
      tavilySearchToMarkdown(apiKey, wideQuery(ticker, key), {
        topic: "general",
        country: "nigeria",
        maxResults: 10,
        searchDepth: "basic",
        excludeDomains: noise,
        sectionHeading: "Web search (B): Nigeria-wide (homonym-safe query)",
      }),
      tavilySearchToMarkdown(apiKey, `${t} Nigeria NGX listed company stock news`, {
        topic: "news",
        maxResults: 7,
        searchDepth: "basic",
        timeRange: "month",
        excludeDomains: noise,
        sectionHeading: "Web search (C): news topic (recent)",
      }),
    ]);
    return `${narrow}\n${wide}\n${recent}`;
  }

  const [narrow, wide] = await Promise.all([
    tavilySearchToMarkdown(apiKey, narrowQuery(ticker, key), {
      topic: "general",
      maxResults: 8,
      searchDepth: "basic",
      includeDomains: [...NGX_PRIORITY_DOMAINS],
      sectionHeading: "Web search (A): NGX & Nigerian financial / news sources",
    }),
    tavilySearchToMarkdown(apiKey, wideQuery(ticker, key), {
      topic: "general",
      country: "nigeria",
      maxResults: 10,
      searchDepth: "basic",
      excludeDomains: noise,
      sectionHeading: "Web search (B): Nigeria-wide (homonym-safe query)",
    }),
  ]);

  return `${narrow}\n${wide}`;
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
    maxResults: index === 0 ? 10 : 8,
    topic: "general",
    searchDepth: "basic",
    country: "nigeria",
    excludeDomains: [...GLOBAL_TICKER_NOISE_DOMAINS],
  };
}
