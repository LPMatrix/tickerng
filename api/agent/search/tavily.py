"""Tavily search → Markdown excerpts."""

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from agent.config.constants import TAVILY_SEARCH_URL


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
