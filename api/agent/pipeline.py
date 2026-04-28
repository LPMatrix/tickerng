"""Build OpenRouter prompts from HTTP JSON payload."""

import os
from typing import Any, Dict

from agent.discovery import run_discovery
from agent.verification import run_verification


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
