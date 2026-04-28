"""User/system prompt builders shared by discovery and verification."""

import re

from agent.prompt_resolve import core_rules


def normalize_ticker(raw: str) -> str:
    return re.sub(r"\s+", "", (raw or "").strip()).upper()


def sanitize_query(raw: str) -> str:
    return re.sub(r"[^\w\s]", "", (raw or "").strip()).strip()


def get_system_prompt_discovery(include_macro: bool) -> str:
    macro_instruction = "Include macro context as section 1." if include_macro else "Do not include a separate Macro Context section."
    return f"""{core_rules()}

You are in DISCOVERY mode. Use only provided web excerpts for claims. {macro_instruction}

When **Per-ticker web excerpts** blocks exist, prefer them for concrete per-stock metrics (price, volume, market cap, P/E, filing snippets).
Return only Markdown report.
"""


def get_user_message(mode: str, query: str) -> str:
    q = sanitize_query(query)
    if mode == "verification":
        return f"Produce a verification report for the following NGX ticker: {q.upper()}. Follow the required section structure using the excerpts below."
    return f'Produce a discovery report for the following query: "{q}". Follow the required section structure and return a shortlist of 3-5 stocks with brief rationale, using the excerpts below.'


def get_synthesis_user_message(ticker: str, memos: dict) -> str:
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
