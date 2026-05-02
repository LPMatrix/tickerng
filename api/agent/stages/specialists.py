"""Per-specialist Tavily context + prompt fragments for verification."""

from concurrent.futures import ThreadPoolExecutor

from agent.config.constants import GLOBAL_TICKER_NOISE_DOMAINS, NGX_EXCHANGE_DOMAINS, NGX_PRIORITY_DOMAINS
from agent.prompts.prompt_resolve import specialist_core
from agent.search.tavily import tavily_depth, tavily_search_to_markdown
from agent.stages.queries import (
    filings_exchange_query,
    macro_query,
    market_data_query,
    narrow_query,
    sentiment_deep_query,
    wide_query,
)


def fundamentals_tavily_markdown(api_key: str, ticker: str) -> str:
    noise = GLOBAL_TICKER_NOISE_DOMAINS
    futures = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures.append(
            ex.submit(
                tavily_search_to_markdown,
                api_key,
                narrow_query(ticker, "fundamentals"),
                {
                    "topic": "finance",
                    "maxResults": 12,
                    "searchDepth": tavily_depth("default"),
                    "includeDomains": NGX_PRIORITY_DOMAINS,
                    "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
                },
            )
        )
        futures.append(
            ex.submit(
                tavily_search_to_markdown,
                api_key,
                wide_query(ticker, "fundamentals"),
                {
                    "topic": "finance",
                    "country": "nigeria",
                    "maxResults": 12,
                    "searchDepth": tavily_depth("default"),
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
                },
            )
        )
        futures.append(
            ex.submit(
                tavily_search_to_markdown,
                api_key,
                filings_exchange_query(ticker),
                {
                    "topic": "finance",
                    "maxResults": 15,
                    "searchDepth": tavily_depth("filing"),
                    "includeDomains": NGX_EXCHANGE_DOMAINS,
                    "sectionHeading": "Web search (C): NGX & FMDQ - filings, reports, key figures",
                },
            )
        )
        futures.append(
            ex.submit(
                tavily_search_to_markdown,
                api_key,
                market_data_query(ticker),
                {
                    "topic": "finance",
                    "maxResults": 10,
                    "searchDepth": tavily_depth("market"),
                    "country": "nigeria",
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (D): market data - price, cap, volume (NGX context)",
                },
            )
        )
        return "\n".join(f.result() for f in futures)


def build_specialist_web_context(api_key: str, ticker: str, key: str) -> str:
    noise = GLOBAL_TICKER_NOISE_DOMAINS
    t = ticker.upper()
    if key == "macro":
        return tavily_search_to_markdown(
            api_key,
            macro_query(ticker),
            {
                "topic": "general",
                "country": "nigeria",
                "maxResults": 10,
                "searchDepth": "basic",
                "excludeDomains": noise,
                "sectionHeading": "Web search: macro & Nigerian market context",
            },
        )
    if key == "fundamentals":
        return fundamentals_tavily_markdown(api_key, ticker)
    if key == "news":
        with ThreadPoolExecutor(max_workers=3) as ex:
            a = ex.submit(
                tavily_search_to_markdown,
                api_key,
                narrow_query(ticker, key),
                {
                    "topic": "general",
                    "maxResults": 8,
                    "searchDepth": tavily_depth("default"),
                    "includeDomains": NGX_PRIORITY_DOMAINS,
                    "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
                },
            )
            b = ex.submit(
                tavily_search_to_markdown,
                api_key,
                wide_query(ticker, key),
                {
                    "topic": "general",
                    "country": "nigeria",
                    "maxResults": 10,
                    "searchDepth": tavily_depth("default"),
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
                },
            )
            c = ex.submit(
                tavily_search_to_markdown,
                api_key,
                f"{t} Nigeria NGX listed company stock news",
                {
                    "topic": "news",
                    "maxResults": 7,
                    "searchDepth": tavily_depth("default"),
                    "timeRange": "month",
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (C): news topic (recent)",
                },
            )
            return f"{a.result()}\n{b.result()}\n{c.result()}"
    if key == "sentiment":
        with ThreadPoolExecutor(max_workers=3) as ex:
            a = ex.submit(
                tavily_search_to_markdown,
                api_key,
                narrow_query(ticker, key),
                {
                    "topic": "general",
                    "maxResults": 8,
                    "searchDepth": tavily_depth("default"),
                    "includeDomains": NGX_PRIORITY_DOMAINS,
                    "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
                },
            )
            b = ex.submit(
                tavily_search_to_markdown,
                api_key,
                wide_query(ticker, key),
                {
                    "topic": "general",
                    "country": "nigeria",
                    "maxResults": 10,
                    "searchDepth": tavily_depth("default"),
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
                },
            )
            c = ex.submit(
                tavily_search_to_markdown,
                api_key,
                sentiment_deep_query(ticker),
                {
                    "topic": "finance",
                    "maxResults": 10,
                    "searchDepth": tavily_depth("sentimentDeep"),
                    "country": "nigeria",
                    "excludeDomains": noise,
                    "sectionHeading": "Web search (C): analyst, coverage, and rating language",
                },
            )
            return f"{a.result()}\n{b.result()}\n{c.result()}"
    raise RuntimeError(f"Unhandled specialist: {key}")


def get_specialist_system_prompt(key: str) -> str:
    core = specialist_core()
    if key == "fundamentals":
        return f"""{core}

Your scope ONLY: company fundamentals and valuation for the given ticker.
Cover: snapshot (sector/mcap/volume), financial summary, valuation.
Do NOT cover macro/news/sentiment in depth.
"""
    if key == "news":
        return f"""{core}

Your scope ONLY: material news and corporate actions for the given ticker.
Cover notable news, corporate actions, upcoming dates.
"""
    if key == "macro":
        return f"""{core}

Your scope ONLY: macro and market context relevant to this ticker/sector.
Cover CBN rate, inflation, FX context, NGX All-Share trend, and one qualitative impact paragraph.
"""
    return f"""{core}

Your scope ONLY: analyst and market sentiment for the given ticker.
Cover ratings/consensus if found, and reliable social sentiment if available.
"""


def get_specialist_user_message(ticker: str, key: str) -> str:
    labels = {
        "fundamentals": "Fundamentals & valuation",
        "news": "News & corporate actions",
        "macro": "Macro & market context",
        "sentiment": "Analyst & sentiment",
    }
    return f"Ticker: {ticker.upper()}\n\nProduce the {labels[key]} specialist memo for this NGX stock using the excerpts below. End with a single [High|Medium|Low] - reason line."
