"""Discovery mode: Tavily context + optional per-ticker enrichment."""

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List

from agent.constants import (
    GLOBAL_TICKER_NOISE_DOMAINS,
    MAX_DISCOVERY_ENRICHMENT_TICKERS,
    TICKER_EXTRACT_SYSTEM,
)
from agent.openrouter import openrouter_generate
from agent.prompts import get_system_prompt_discovery, get_user_message
from agent.specialists import fundamentals_tavily_markdown
from agent.tavily import tavily_search_to_markdown


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
        parsed = json.loads(trimmed[start : end + 1])
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


def run_discovery(query: str, include_macro_context: bool, tavily_api_key: str) -> Dict[str, str]:
    system_prompt = get_system_prompt_discovery(include_macro_context)
    base_user_message = get_user_message("discovery", query)

    qlist = discovery_tavily_queries(query, include_macro_context)
    blocks: List[str] = []
    for i, q in enumerate(qlist):
        blocks.append(
            tavily_search_to_markdown(
                tavily_api_key,
                q,
                {
                    "maxResults": 12 if i == 0 else 8,
                    "topic": "general",
                    "searchDepth": "basic",
                    "country": "nigeria",
                    "excludeDomains": GLOBAL_TICKER_NOISE_DOMAINS,
                    "sectionHeading": "Web search: your query (NGX-focused)" if i == 0 else "Web search: macro & NGX market",
                },
            )
        )
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
                    ex.submit(fundamentals_tavily_markdown, tavily_api_key, t): t for t in candidate_tickers
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
                "**Per-ticker web excerpts** (prefer these blocks for price, volume, market cap, P/E, and filing snippets when present; "
                "the sections above are broader discovery context):\n\n"
                f"{chr(10).join(per_ticker_blocks)}"
            )
    except Exception:
        pass

    return {"system": system_prompt, "user": user_message}
