"""Discovery mode: Tavily context + optional per-ticker enrichment."""

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional

from langfuse import get_client, observe

from agent.config.constants import GLOBAL_TICKER_NOISE_DOMAINS, MAX_DISCOVERY_ENRICHMENT_TICKERS
from agent.llm.openrouter import openrouter_generate
from agent.prompts.prompt_resolve import ticker_extract_system
from agent.prompts.prompts import get_system_prompt_discovery, get_user_message
from agent.search.tavily import tavily_search_to_markdown
from agent.stages.specialists import fundamentals_tavily_markdown
from agent.observability.tracing import (
    agent_tracing_enabled,
    current_trace_context,
    default_openrouter_model,
    threaded_span,
    truncate_io,
)


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


def _enrichment_block(api_key: str, ticker: str, trace_context: Optional[Dict[str, str]]) -> str:
    """Single ticker's Tavily bundle (runs in thread pool)."""
    with threaded_span(
        name=f"discovery.enrichment-{ticker}",
        trace_context=trace_context,
        metadata={"ticker": ticker},
        input_payload={"ticker": ticker},
    ) as obs:
        md = fundamentals_tavily_markdown(api_key, ticker)
        if obs is not None:
            obs.update(output=truncate_io(md))
        return md


@observe(name="discovery.pipeline", capture_input=False, capture_output=False)
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

    tc = current_trace_context()

    try:
        extraction_user = f"User query:\n{query.strip()}\n\nWeb excerpts (may be partial):\n{initial_md[:120000]}"
        if agent_tracing_enabled():
            with get_client().start_as_current_observation(
                name="discovery.ticker-extract",
                as_type="generation",
                model=default_openrouter_model(),
                metadata={"stage": "parse-json-tickers"},
                input={"query_preview": query.strip()[:500]},
            ) as extract_obs:
                extract_text = openrouter_generate(
                    ticker_extract_system(), extraction_user, max_tokens=256, temperature=0
                )
                extract_obs.update(output=truncate_io(extract_text or "", max_chars=4000))
        else:
            extract_text = openrouter_generate(ticker_extract_system(), extraction_user, max_tokens=256, temperature=0)
        candidate_tickers = parse_tickers_from_extraction_json(extract_text)
        if candidate_tickers:
            per_ticker_blocks: List[str] = []
            with ThreadPoolExecutor(max_workers=min(5, len(candidate_tickers))) as ex:
                future_map = {
                    ex.submit(_enrichment_block, tavily_api_key, t, tc): t for t in candidate_tickers
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
