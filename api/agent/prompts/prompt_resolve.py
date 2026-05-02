"""
Resolve narrative prompts: Langfuse text prompts when configured, else ``prompt_fallbacks``.

Create **text** prompts in Langfuse with these names (Production label by default):

- ``tickerng-core-rules`` — shared NGX reporting rules (discovery + verification tone).
- ``tickerng-specialist-core`` — specialist memo wrapper (verification parallel passes).
- ``tickerng-synthesis-system`` — final verification report from four memos.
- ``tickerng-ticker-extract`` — JSON ticker shortlist for discovery enrichment.

Disable remote resolution: ``LANGFUSE_PROMPTS_ENABLED=false`` or omit Langfuse keys (falls back always).

Requires ``LANGFUSE_SECRET_KEY`` and ``LANGFUSE_PUBLIC_KEY`` when Langfuse prompts are enabled.
"""

from __future__ import annotations

import os
from typing import Optional

from agent.prompts.prompt_fallbacks import (
    CORE_RULES,
    SPECIALIST_CORE,
    SYNTHESIS_SYSTEM,
    TICKER_EXTRACT_SYSTEM,
)


def _langfuse_enabled() -> bool:
    if os.getenv("LANGFUSE_PROMPTS_ENABLED", "true").strip().lower() == "false":
        return False
    sk = (os.getenv("LANGFUSE_SECRET_KEY") or "").strip()
    pk = (os.getenv("LANGFUSE_PUBLIC_KEY") or "").strip()
    return bool(sk and pk)


def _label() -> Optional[str]:
    raw = (os.getenv("LANGFUSE_PROMPT_LABEL") or "production").strip()
    return raw or None


def _cache_ttl() -> Optional[int]:
    raw = (os.getenv("LANGFUSE_PROMPT_CACHE_TTL_SECONDS") or "300").strip()
    try:
        return max(0, int(raw))
    except ValueError:
        return 300


def _base_url() -> Optional[str]:
    u = (os.getenv("LANGFUSE_BASE_URL") or os.getenv("LANGFUSE_HOST") or "").strip()
    return u or None


def _resolve_text(langfuse_name: str, fallback: str) -> str:
    if not _langfuse_enabled():
        return fallback
    try:
        from langfuse import Langfuse
    except ImportError:
        return fallback

    try:
        kwargs = {
            "secret_key": os.environ["LANGFUSE_SECRET_KEY"].strip(),
            "public_key": os.environ["LANGFUSE_PUBLIC_KEY"].strip(),
            "tracing_enabled": False,
        }
        bu = _base_url()
        if bu:
            kwargs["base_url"] = bu
        lf = Langfuse(**kwargs)
        label = _label()
        ttl = _cache_ttl()
        gp_kw = {
            "type": "text",
            "fallback": fallback,
            "cache_ttl_seconds": ttl,
        }
        if label is not None:
            gp_kw["label"] = label
        prompt = lf.get_prompt(langfuse_name, **gp_kw)
        text = prompt.compile()
        if isinstance(text, str) and text.strip():
            return text.strip()
    except Exception:
        pass
    return fallback


def core_rules() -> str:
    return _resolve_text("tickerng-core-rules", CORE_RULES)


def specialist_core() -> str:
    return _resolve_text("tickerng-specialist-core", SPECIALIST_CORE)


def synthesis_system() -> str:
    return _resolve_text("tickerng-synthesis-system", SYNTHESIS_SYSTEM)


def ticker_extract_system() -> str:
    return _resolve_text("tickerng-ticker-extract", TICKER_EXTRACT_SYSTEM)
