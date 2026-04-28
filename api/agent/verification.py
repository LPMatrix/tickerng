"""Verification mode: parallel specialists + synthesis prompt."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict

from agent.constants import SPECIALIST_KEYS, SYNTHESIS_SYSTEM
from agent.openrouter import openrouter_generate
from agent.prompts import get_synthesis_user_message, normalize_ticker
from agent.specialists import (
    build_specialist_web_context,
    get_specialist_system_prompt,
    get_specialist_user_message,
)


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
