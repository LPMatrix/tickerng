import json
import os
import re
import traceback
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional


TAVILY_SEARCH_URL = "https://api.tavily.com/search"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

SPECIALIST_KEYS = ["fundamentals", "news", "macro", "sentiment"]
MAX_DISCOVERY_ENRICHMENT_TICKERS = 5

NGX_PRIORITY_DOMAINS = [
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
]

NGX_EXCHANGE_DOMAINS = ["ngxgroup.com", "fmdqgroup.com"]

GLOBAL_TICKER_NOISE_DOMAINS = [
    "investing.com",
    "finance.yahoo.com",
    "yahoo.com",
    "marketwatch.com",
    "msn.com",
    "seekingalpha.com",
    "morningstar.com",
    "stockanalysis.com",
]


CORE_RULES = """
You are a research assistant for the Nigerian Exchange (NGX). Your output must always be a structured report in Markdown - never freeform conversation or chat.

Rules you must follow:
- Output format: Use Markdown section headers (##, ###), short tables for metrics where appropriate, and brief prose for qualitative commentary. No bullet-heavy walls; structure for quick scanning.
- No hallucination: If a data point cannot be found in the provided excerpts, say so explicitly in that section (e.g. "Data not found" or "No recent source available"). Never fabricate EPS, P/E, revenue, or any financial figure.
- Confidence signalling: At the end of each major section (except "Next Step"), append a confidence marker on its own line in this exact format:
  [High] - reason
  [Medium] - reason
  [Low] - reason
- Conflicting data: If two sources report different figures for the same metric, do not choose one silently. Present both and note the discrepancy explicitly.
- Recency: Prefer sources from the last 90 days; if older, say so.
- Analyst scepticism: NGX analyst coverage is sparse and often lagged. If no recent analyst ratings are found, state "No recent analyst consensus found".
""".strip()

SPECIALIST_CORE = """
You are an NGX (Nigerian Exchange) research specialist. Output Markdown only - no preamble or meta-commentary.

Rules:
- Use only the web search excerpts in the user message below for factual claims.
- The ticker is an NGX listing. Ignore clear non-Nigeria homonym snippets unless explicitly tied to NGX/Nigeria.
- Never fabricate figures. If data is missing, say "Data not found".
- At the end include exactly one confidence line:
  [High] - reason
  [Medium] - reason
  [Low] - reason
""".strip()

SYNTHESIS_SYSTEM = """
You are the lead editor for TickerNG verification reports (Nigerian Exchange). You receive four specialist memos (fundamentals, news, macro, sentiment). You do NOT have web search - work only from the memos.

Output a single Markdown verification report for the user. No preamble.

Use the exact required sections:
### 1. Company Snapshot
### 2. Financial Summary
### 3. Valuation
### 4. Catalysts
### 5. Analyst Sentiment
### 6. Verdict

Each section must end with one confidence line in [High|Medium|Low] format.
""".strip()

TICKER_EXTRACT_SYSTEM = """
You extract Nigerian Exchange (NGX) equity ticker symbols for a discovery shortlist.

Return ONLY valid JSON (no markdown fences) in this exact shape:
{"tickers":["TICKER1","TICKER2"]}

Rules:
- 0 to 5 tickers. Uppercase letters and digits only.
- Each ticker must plausibly match the user's question AND appear in, or be strongly implied by, the provided web excerpts.
- If excerpts do not support any specific tickers, return {"tickers":[]}.
- Do not invent tickers.
""".strip()


def _json_response(handler: Any, status: int, payload: Dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _openrouter_http_error_detail(e: urllib.error.HTTPError) -> str:
    """Readable message from OpenRouter/provider JSON error bodies."""
    try:
        raw = e.read().decode("utf-8")
    except Exception:
        return f"HTTP {e.code} {e.reason}"
    if not raw.strip():
        return f"HTTP {e.code} {e.reason}"
    try:
        d = json.loads(raw)
    except json.JSONDecodeError:
        return raw[:1200].strip()

    err = d.get("error")
    if isinstance(err, dict):
        msg = err.get("message")
        meta = err.get("metadata") if isinstance(err.get("metadata"), dict) else {}
        code = err.get("code") or err.get("type")
        bits = []
        if isinstance(msg, str) and msg.strip():
            bits.append(msg.strip())
        elif isinstance(msg, dict):
            bits.append(json.dumps(msg)[:400])
        if isinstance(code, str) and code.strip():
            bits.append(f"code={code}")
        prov = meta.get("provider_name") if isinstance(meta, dict) else None
        if isinstance(prov, str) and prov.strip():
            bits.append(f"provider={prov}")
        if bits:
            return " — ".join(bits)
        return json.dumps(err)[:800]

    if isinstance(err, str) and err.strip():
        return err.strip()

    msg = d.get("message")
    if isinstance(msg, str) and msg.strip():
        return msg.strip()

    return raw[:1200].strip()


def _attach_top_level_prompt_cache_if_enabled(payload: Dict[str, Any]) -> None:
    """
    Opt-in Anthropic-style top-level ``cache_control``. OpenRouter often returns HTTP 400 when this
    is present (streaming *and* non-streaming — including parallel specialist ``openrouter_generate`` calls).

    Default off. Enable only when OpenRouter confirms support for your API key + model.
    """
    if os.getenv("OPENROUTER_PROMPT_CACHE_TOP_LEVEL", "false").strip().lower() != "true":
        return
    if os.getenv("OPENROUTER_PROMPT_CACHE_ENABLED", "true").strip().lower() == "false":
        return
    model = str(payload.get("model") or "")
    if not model.startswith("anthropic/"):
        return
    cache_ttl = os.getenv("OPENROUTER_PROMPT_CACHE_TTL", "5m").strip().lower()
    payload["cache_control"] = {"type": "ephemeral", **({"ttl": "1h"} if cache_ttl == "1h" else {})}


def _stream_failure_user_message(exc: BaseException) -> str:
    """Safe one-line-ish explanation for Markdown error section (logs retain full traceback)."""
    if isinstance(exc, RuntimeError):
        msg = str(exc)
        if msg.startswith("OpenRouter error:"):
            return msg
        return msg
    if isinstance(exc, (BrokenPipeError, ConnectionResetError)):
        return "The connection closed before the report finished (browser tab closed, network drop, or timeout)."
    name = type(exc).__name__
    if isinstance(exc, OSError) or "timeout" in name.lower():
        return (
            "Network or timeout error while contacting the model. Try again; "
            "if it persists, try a shorter query or check OpenRouter status."
        )
    return "The response stream was interrupted. Please try again."


def _text_response(handler: Any, status: int, text: str) -> None:
    body = text.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/plain; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def normalize_ticker(raw: str) -> str:
    return re.sub(r"\s+", "", (raw or "").strip()).upper()


def sanitize_query(raw: str) -> str:
    return re.sub(r"[^\w\s]", "", (raw or "").strip()).strip()


def tavily_depth(phase: str) -> str:
    global_depth = os.getenv("TAVILY_SEARCH_DEPTH", "").strip().lower()
    if global_depth in ["advanced", "basic", "fast", "ultra-fast"]:
        return global_depth
    if phase in ["filing", "market", "sentimentDeep"]:
        return "advanced"
    return "basic"


def tavily_search_to_markdown(api_key: str, query: str, options: Optional[Dict[str, Any]] = None) -> str:
    options = options or {}
    trimmed = (query or "").strip()
    heading = options.get("sectionHeading", "Web search excerpts")
    if not trimmed:
        return f"## {heading}\n\n_No query provided._\n"

    topic = options.get("topic", "general")
    body: Dict[str, Any] = {
        "api_key": api_key,
        "query": trimmed,
        "search_depth": options.get("searchDepth", "basic"),
        "max_results": max(1, min(20, int(options.get("maxResults", 6)))),
        "topic": topic,
    }
    if options.get("timeRange"):
        body["time_range"] = options["timeRange"]
    if options.get("country") and topic in ("general", "finance"):
        body["country"] = options["country"]
    if options.get("includeDomains"):
        body["include_domains"] = options["includeDomains"][:300]
    if options.get("excludeDomains"):
        body["exclude_domains"] = options["excludeDomains"][:150]

    req = urllib.request.Request(
        TAVILY_SEARCH_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            d = json.loads(e.read().decode("utf-8"))
            msg = d.get("error") or d.get("message") or str(e)
        except Exception:
            msg = str(e)
        return f"## {heading}\n\n_Search failed ({getattr(e, 'code', 500)}): {msg}_\n"
    except Exception as e:
        return f"## {heading}\n\n_Search failed: {e}_\n"

    results = data.get("results") or []
    if not results:
        return f"## {heading}\n\n_No results returned for this query._\n"

    lines = [f"## {heading}", ""]
    for i, r in enumerate(results, start=1):
        title = (r.get("title") or "Untitled").strip()
        url = (r.get("url") or "").strip()
        published = (r.get("published_date") or "").strip()
        content = (r.get("content") or "").strip() or "_No snippet._"
        lines.append(f"### {i}. {title}")
        if url:
            lines.append(f"Source: {url}")
        if published:
            lines.append(f"Published: {published}")
        lines.append(content)
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def openrouter_generate(system: str, user_content: str, max_tokens: int, temperature: Optional[float] = None) -> str:
    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    model = (os.getenv("OPENROUTER_MODEL") or "anthropic/claude-sonnet-4.6").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
    }
    if temperature is not None:
        payload["temperature"] = temperature

    _attach_top_level_prompt_cache_if_enabled(payload)

    req = urllib.request.Request(
        OPENROUTER_CHAT_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenRouter error: {_openrouter_http_error_detail(e)}") from e
    except Exception as e:
        raise RuntimeError(f"OpenRouter error: {e}") from e

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("No choices returned from model")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        text_chunks = [c.get("text", "") for c in content if isinstance(c, dict)]
        return "".join(text_chunks).strip()
    return (content or "").strip()


def openrouter_stream_generate(
    system: str,
    user_content: str,
    max_tokens: int,
    temperature: Optional[float] = None,
):
    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    model = (os.getenv("OPENROUTER_MODEL") or "anthropic/claude-sonnet-4.6").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
        "stream": True,
    }
    if temperature is not None:
        payload["temperature"] = temperature

    _attach_top_level_prompt_cache_if_enabled(payload)

    req = urllib.request.Request(
        OPENROUTER_CHAT_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )

    # Long SSE streams: each socket read waits up to this many seconds (gap between chunks).
    stream_timeout = int(os.getenv("OPENROUTER_STREAM_READ_TIMEOUT", "600"))

    try:
        with urllib.request.urlopen(req, timeout=stream_timeout) as res:
            for raw_line in res:
                line = raw_line.decode("utf-8", errors="ignore").strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    event = json.loads(data_str)
                except Exception:
                    continue
                choices = event.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                content = delta.get("content")
                if isinstance(content, str) and content:
                    yield content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            txt = item.get("text")
                            if isinstance(txt, str) and txt:
                                yield txt
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenRouter error: {_openrouter_http_error_detail(e)}") from e
    except Exception as e:
        raise RuntimeError(f"OpenRouter error: {e}") from e


def narrow_query(ticker: str, key: str) -> str:
    t = ticker.upper()
    if key == "fundamentals":
        return f'{t} NGX "Nigerian Stock Exchange" listed company annual report interim results IFRS audited "facts behind the figures" revenue profit EPS EBITDA dividend market cap share price naira volume doclib'
    if key == "news":
        return f'{t} NGX Nigeria stock dividend AGM bonus split rights issue results announcement corporate action Notices Circular'
    if key == "sentiment":
        return f'{t} NGX Nigeria stock analyst equity research "price target" buy hold sell consensus'
    return f"{t} NGX Nigeria"


def wide_query(ticker: str, key: str) -> str:
    t = ticker.upper()
    ngx = '(NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR "Lagos" OR ngxgroup.com OR "quoted company Nigeria" OR naira)'
    if key == "fundamentals":
        return f'"{t}" {ngx} (financial statements OR "P/E" OR "P/B" OR ROE OR dividend yield OR "shares in issue" OR "market cap" OR "share price" OR "volume" OR "free float" OR "closing bid")'
    if key == "news":
        return f'"{t}" {ngx} (M&A OR acquisition OR "board changes" OR CEO OR dividend OR "AGM" OR "EGM" OR 2024 OR 2025 OR 2026) stock news corporate'
    if key == "sentiment":
        return f'"{t}" {ngx} (stock OR equity OR shares) (analyst OR consensus OR "research note" OR rating OR outlook) Nigeria'
    return f'"{t}" {ngx}'


def filings_exchange_query(ticker: str) -> str:
    t = ticker.upper()
    return f'{t} ("annual report" OR "interim results" OR "unaudited results" OR "audited financial" OR "full year" OR IFRS) (revenue OR "profit after tax" OR EPS OR "total assets" OR "shareholders\' funds" OR "market capitalisation" OR naira) NGX "Nigerian Exchange" financial statements 2023 2024 2025'


def market_data_query(ticker: str) -> str:
    t = ticker.upper()
    return f'"{t}" (NGX OR "Nigerian Exchange" OR "Lagos" OR "NSE:" OR naira) share price "market capitalisation" OR "market cap" "volume traded" "closing price" OR "last done" OR "YTD" equity'


def sentiment_deep_query(ticker: str) -> str:
    t = ticker.upper()
    return f'"{t}" (Nigeria OR NGX OR "Lagos bourse" OR naira) ("equity research" OR "initiating coverage" OR "price target" OR "Earnings" OR "FY" OR "Q1" OR "Q2" OR "Q3" OR "Q4" OR "Buy" OR "Hold" OR "Sell" OR "Overweight" OR "Underweight") (analyst OR broker OR research)'


def macro_query(ticker: str) -> str:
    t = ticker.upper()
    return f"Nigeria CBN monetary policy rate MPR headline inflation naira exchange rate NGX All Share Index Nigerian capital market listed equities context for ticker {t}"


def fundamentals_tavily_markdown(api_key: str, ticker: str) -> str:
    noise = GLOBAL_TICKER_NOISE_DOMAINS
    futures = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures.append(ex.submit(tavily_search_to_markdown, api_key, narrow_query(ticker, "fundamentals"), {
            "topic": "finance",
            "maxResults": 12,
            "searchDepth": tavily_depth("default"),
            "includeDomains": NGX_PRIORITY_DOMAINS,
            "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
        }))
        futures.append(ex.submit(tavily_search_to_markdown, api_key, wide_query(ticker, "fundamentals"), {
            "topic": "finance",
            "country": "nigeria",
            "maxResults": 12,
            "searchDepth": tavily_depth("default"),
            "excludeDomains": noise,
            "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
        }))
        futures.append(ex.submit(tavily_search_to_markdown, api_key, filings_exchange_query(ticker), {
            "topic": "finance",
            "maxResults": 15,
            "searchDepth": tavily_depth("filing"),
            "includeDomains": NGX_EXCHANGE_DOMAINS,
            "sectionHeading": "Web search (C): NGX & FMDQ - filings, reports, key figures",
        }))
        futures.append(ex.submit(tavily_search_to_markdown, api_key, market_data_query(ticker), {
            "topic": "finance",
            "maxResults": 10,
            "searchDepth": tavily_depth("market"),
            "country": "nigeria",
            "excludeDomains": noise,
            "sectionHeading": "Web search (D): market data - price, cap, volume (NGX context)",
        }))
        return "\n".join(f.result() for f in futures)


def build_specialist_web_context(api_key: str, ticker: str, key: str) -> str:
    noise = GLOBAL_TICKER_NOISE_DOMAINS
    t = ticker.upper()
    if key == "macro":
        return tavily_search_to_markdown(api_key, macro_query(ticker), {
            "topic": "general",
            "country": "nigeria",
            "maxResults": 10,
            "searchDepth": "basic",
            "excludeDomains": noise,
            "sectionHeading": "Web search: macro & Nigerian market context",
        })
    if key == "fundamentals":
        return fundamentals_tavily_markdown(api_key, ticker)
    if key == "news":
        with ThreadPoolExecutor(max_workers=3) as ex:
            a = ex.submit(tavily_search_to_markdown, api_key, narrow_query(ticker, key), {
                "topic": "general",
                "maxResults": 8,
                "searchDepth": tavily_depth("default"),
                "includeDomains": NGX_PRIORITY_DOMAINS,
                "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
            })
            b = ex.submit(tavily_search_to_markdown, api_key, wide_query(ticker, key), {
                "topic": "general",
                "country": "nigeria",
                "maxResults": 10,
                "searchDepth": tavily_depth("default"),
                "excludeDomains": noise,
                "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
            })
            c = ex.submit(tavily_search_to_markdown, api_key, f"{t} Nigeria NGX listed company stock news", {
                "topic": "news",
                "maxResults": 7,
                "searchDepth": tavily_depth("default"),
                "timeRange": "month",
                "excludeDomains": noise,
                "sectionHeading": "Web search (C): news topic (recent)",
            })
            return f"{a.result()}\n{b.result()}\n{c.result()}"
    if key == "sentiment":
        with ThreadPoolExecutor(max_workers=3) as ex:
            a = ex.submit(tavily_search_to_markdown, api_key, narrow_query(ticker, key), {
                "topic": "general",
                "maxResults": 8,
                "searchDepth": tavily_depth("default"),
                "includeDomains": NGX_PRIORITY_DOMAINS,
                "sectionHeading": "Web search (A): NGX & Nigerian financial / news sources",
            })
            b = ex.submit(tavily_search_to_markdown, api_key, wide_query(ticker, key), {
                "topic": "general",
                "country": "nigeria",
                "maxResults": 10,
                "searchDepth": tavily_depth("default"),
                "excludeDomains": noise,
                "sectionHeading": "Web search (B): Nigeria-wide (homonym-safe query)",
            })
            c = ex.submit(tavily_search_to_markdown, api_key, sentiment_deep_query(ticker), {
                "topic": "finance",
                "maxResults": 10,
                "searchDepth": tavily_depth("sentimentDeep"),
                "country": "nigeria",
                "excludeDomains": noise,
                "sectionHeading": "Web search (C): analyst, coverage, and rating language",
            })
            return f"{a.result()}\n{b.result()}\n{c.result()}"
    raise RuntimeError(f"Unhandled specialist: {key}")


def get_specialist_system_prompt(key: str) -> str:
    if key == "fundamentals":
        return f"""{SPECIALIST_CORE}

Your scope ONLY: company fundamentals and valuation for the given ticker.
Cover: snapshot (sector/mcap/volume), financial summary, valuation.
Do NOT cover macro/news/sentiment in depth.
"""
    if key == "news":
        return f"""{SPECIALIST_CORE}

Your scope ONLY: material news and corporate actions for the given ticker.
Cover notable news, corporate actions, upcoming dates.
"""
    if key == "macro":
        return f"""{SPECIALIST_CORE}

Your scope ONLY: macro and market context relevant to this ticker/sector.
Cover CBN rate, inflation, FX context, NGX All-Share trend, and one qualitative impact paragraph.
"""
    return f"""{SPECIALIST_CORE}

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


def get_synthesis_user_message(ticker: str, memos: Dict[str, str]) -> str:
    t = ticker.upper()
    return f"""Produce the final verification report for NGX ticker {t}.

<fundamentals_memo>
{memos.get("fundamentals", "")}
</fundamentals_memo>

<news_memo>
{memos.get("news", "")}
</news_memo>

<macro_memo>
{memos.get("macro", "")}
</macro_memo>

<sentiment_memo>
{memos.get("sentiment", "")}
</sentiment_memo>
"""


def get_system_prompt_discovery(include_macro: bool) -> str:
    macro_instruction = "Include macro context as section 1." if include_macro else "Do not include a separate Macro Context section."
    return f"""{CORE_RULES}

You are in DISCOVERY mode. Use only provided web excerpts for claims. {macro_instruction}

When **Per-ticker web excerpts** blocks exist, prefer them for concrete per-stock metrics (price, volume, market cap, P/E, filing snippets).
Return only Markdown report.
"""


def get_user_message(mode: str, query: str) -> str:
    q = sanitize_query(query)
    if mode == "verification":
        return f"Produce a verification report for the following NGX ticker: {q.upper()}. Follow the required section structure using the excerpts below."
    return f'Produce a discovery report for the following query: "{q}". Follow the required section structure and return a shortlist of 3-5 stocks with brief rationale, using the excerpts below.'


def discovery_tavily_queries(user_query: str, include_macro: bool) -> List[str]:
    q = user_query.strip()
    primary = f'{q} (NGX OR "Nigerian Exchange" OR "NSE Nigeria" OR Lagos) listed stocks equities Nigeria'
    if not include_macro:
        return [primary]
    return [primary, "Nigeria CBN interest rate inflation naira NGX All Share Index Nigerian stock market 2025 2026"]


def parse_tickers_from_extraction_json(text: str) -> List[str]:
    trimmed = (text or "").strip()
    start = trimmed.find("{")
    end = trimmed.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return []
    try:
        parsed = json.loads(trimmed[start:end + 1])
    except Exception:
        return []
    tickers = parsed.get("tickers")
    if not isinstance(tickers, list):
        return []
    out: List[str] = []
    seen = set()
    for item in tickers:
        if not isinstance(item, str):
            continue
        n = re.sub(r"[^A-Z0-9]", "", item.strip().upper())
        if len(n) < 2 or len(n) > 15 or n in seen:
            continue
        seen.add(n)
        out.append(n)
        if len(out) >= MAX_DISCOVERY_ENRICHMENT_TICKERS:
            break
    return out


def run_specialist(tavily_api_key: str, key: str, ticker: str) -> str:
    label = key.capitalize()
    try:
        search_md = build_specialist_web_context(tavily_api_key, ticker, key)
        user_content = f"{get_specialist_user_message(ticker, key)}\n\n{search_md}"
        text = openrouter_generate(get_specialist_system_prompt(key), user_content, max_tokens=4096)
        if not text:
            return f"### {label} specialist\n\nNo text returned from model.\n\n[Low] - empty specialist response"
        return text
    except Exception as e:
        return f"### {label} specialist failed\n\n{e}\n\n[Low] - specialist API error"


def run_verification(query: str, tavily_api_key: str) -> Dict[str, str]:
    ticker = normalize_ticker(query)
    if not ticker:
        raise ValueError("Missing or invalid ticker")

    memos: Dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        future_map = {ex.submit(run_specialist, tavily_api_key, k, ticker): k for k in SPECIALIST_KEYS}
        for f in as_completed(future_map):
            memos[future_map[f]] = f.result()

    synthesis_user = get_synthesis_user_message(ticker, memos)
    return {"system": SYNTHESIS_SYSTEM, "user": synthesis_user}


def run_discovery(query: str, include_macro_context: bool, tavily_api_key: str) -> Dict[str, str]:
    system_prompt = get_system_prompt_discovery(include_macro_context)
    base_user_message = get_user_message("discovery", query)

    qlist = discovery_tavily_queries(query, include_macro_context)
    blocks: List[str] = []
    for i, q in enumerate(qlist):
        blocks.append(tavily_search_to_markdown(tavily_api_key, q, {
            "maxResults": 12 if i == 0 else 8,
            "topic": "general",
            "searchDepth": "basic",
            "country": "nigeria",
            "excludeDomains": GLOBAL_TICKER_NOISE_DOMAINS,
            "sectionHeading": "Web search: your query (NGX-focused)" if i == 0 else "Web search: macro & NGX market",
        }))
    initial_md = "\n\n".join(blocks)
    user_message = f"{base_user_message}\n\n{initial_md}"

    try:
        extraction_user = f"User query:\n{query.strip()}\n\nWeb excerpts (may be partial):\n{initial_md[:120000]}"
        extract_text = openrouter_generate(TICKER_EXTRACT_SYSTEM, extraction_user, max_tokens=256, temperature=0)
        candidate_tickers = parse_tickers_from_extraction_json(extract_text)
        if candidate_tickers:
            per_ticker_blocks: List[str] = []
            with ThreadPoolExecutor(max_workers=min(5, len(candidate_tickers))) as ex:
                future_map = {
                    ex.submit(fundamentals_tavily_markdown, tavily_api_key, t): t
                    for t in candidate_tickers
                }
                for f in as_completed(future_map):
                    t = future_map[f]
                    try:
                        md = f.result()
                        per_ticker_blocks.append(f"### Per-ticker excerpts: {t}\n\n{md}")
                    except Exception as e:
                        per_ticker_blocks.append(f"### Per-ticker excerpts: {t}\n\n_(Enrichment failed: {e})_")
            user_message = (
                f"{base_user_message}\n\n{initial_md}\n\n---\n\n"
                f"**Per-ticker web excerpts** (prefer these blocks for price, volume, market cap, P/E, and filing snippets when present; "
                f"the sections above are broader discovery context):\n\n"
                f"{chr(10).join(per_ticker_blocks)}"
            )
    except Exception:
        pass

    return {"system": system_prompt, "user": user_message}


def process_request(payload: Dict[str, Any]) -> Dict[str, str]:
    mode = "discovery" if payload.get("mode") == "discovery" else "verification"
    query = (payload.get("query") or "").strip()
    include_macro_context = bool(payload.get("includeMacroContext", True)) if mode == "discovery" else False

    if not query:
        raise ValueError("Missing or invalid query")

    if not (os.getenv("OPENROUTER_API_KEY") or "").strip():
        raise RuntimeError("OPENROUTER_API_KEY is not configured")
    tavily_api_key = (os.getenv("TAVILY_API_KEY") or "").strip()
    if not tavily_api_key:
        raise RuntimeError("TAVILY_API_KEY is not configured")

    if mode == "verification":
        return run_verification(query, tavily_api_key)
    return run_discovery(query, include_macro_context, tavily_api_key)


class handler(BaseHTTPRequestHandler):  # Vercel Python entrypoint
    def do_POST(self) -> None:
        try:
            content_length = int(self.headers.get("content-length", 0))
            raw = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
            payload = json.loads(raw or "{}")
            prompt = process_request(payload)
        except ValueError as e:
            _json_response(self, 400, {"error": str(e)})
            return
        except RuntimeError as e:
            _json_response(self, 503, {"error": str(e)})
            return
        except Exception:
            _json_response(self, 500, {"error": "Research request failed"})
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-cache, no-transform")
        self.end_headers()

        try:
            streamed_any = False
            for chunk in openrouter_stream_generate(
                prompt["system"],
                prompt["user"],
                max_tokens=8192,
            ):
                streamed_any = True
                self.wfile.write(chunk.encode("utf-8"))
                self.wfile.flush()

            if not streamed_any:
                self.wfile.write(b"## Error\n\nNo content returned from model.")
                self.wfile.flush()
        except BrokenPipeError:
            return
        except ConnectionResetError:
            return
        except Exception as e:
            traceback.print_exc()
            try:
                msg = _stream_failure_user_message(e)
                self.wfile.write(f"\n\n## Error\n\n{msg}".encode("utf-8"))
                self.wfile.flush()
            except BrokenPipeError:
                return

    def log_message(self, format: str, *args: Any) -> None:
        # Silence default HTTP server logs in serverless runtime.
        return
