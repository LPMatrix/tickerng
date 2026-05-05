"""Verification mode: parallel specialists + synthesis prompt."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Optional

from langfuse import observe

from agent.config.constants import SPECIALIST_KEYS
from agent.llm.openrouter import model_for, openrouter_generate
from agent.observability.tracing import current_trace_context, threaded_generation, truncate_io
from agent.prompts.prompt_resolve import contrarian_system, synthesis_system
from agent.prompts.prompts import get_synthesis_user_message, normalize_ticker
from agent.stages.specialists import (
    build_specialist_web_context,
    get_specialist_system_prompt,
    get_specialist_user_message,
)


def run_specialist(
    tavily_api_key: str,
    key: str,
    ticker: str,
    trace_context: Optional[Dict[str, str]] = None,
) -> str:
    label = key.capitalize()
    try:
        search_md = build_specialist_web_context(tavily_api_key, ticker, key)
        user_content = f"{get_specialist_user_message(ticker, key)}\n\n{search_md}"
        specialist_model = model_for("specialist")
        with threaded_generation(
            name=f"specialist-{key}",
            trace_context=trace_context,
            metadata={"ticker": ticker, "specialist": key},
            input_payload={"ticker": ticker, "specialist": key},
            model=specialist_model,
        ) as obs:
            text = openrouter_generate(
                get_specialist_system_prompt(key),
                user_content,
                max_tokens=4096,
                model=specialist_model,
            )
            if obs is not None:
                obs.update(
                    output=truncate_io(text)
                    if text
                    else "### empty specialist response"
                )
        if not text:
            return f"### {label} specialist\n\nNo text returned from model.\n\n[Low] - empty specialist response"
        return text
    except Exception as e:
        return f"### {label} specialist failed\n\n{e}\n\n[Low] - specialist API error"


def _contrarian_user_bundle(ticker: str, memos: Dict[str, str]) -> str:
    return f"""Ticker: {ticker.upper()}

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

Produce the contrarian memo as specified in your system instructions.
"""


def run_contrarian(
    ticker: str,
    memos: Dict[str, str],
    trace_context: Optional[Dict[str, str]] = None,
) -> str:
    """Single adversarial pass over specialist outputs (no extra web search)."""
    try:
        user_content = _contrarian_user_bundle(ticker, memos)
        contrarian_model = model_for("contrarian")
        with threaded_generation(
            name="contrarian",
            trace_context=trace_context,
            metadata={"ticker": ticker},
            input_payload={"ticker": ticker},
            model=contrarian_model,
        ) as obs:
            text = openrouter_generate(
                contrarian_system(),
                user_content,
                max_tokens=3072,
                model=contrarian_model,
            )
            if obs is not None:
                obs.update(
                    output=truncate_io(text)
                    if text
                    else "### empty contrarian response"
                )
        if not text:
            return (
                "### Contrarian memo\n\nNo text returned from model.\n\n"
                "[Low] - empty contrarian response"
            )
        return text
    except Exception as e:
        return f"### Contrarian memo failed\n\n{e}\n\n[Low] - contrarian API error"


@observe(name="verification.pipeline", capture_input=False, capture_output=False)
def run_verification(query: str, tavily_api_key: str) -> Dict[str, str]:
    ticker = normalize_ticker(query)
    if not ticker:
        raise ValueError("Missing or invalid ticker")

    tc = current_trace_context()

    memos: Dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        future_map = {
            ex.submit(run_specialist, tavily_api_key, k, ticker, tc): k for k in SPECIALIST_KEYS
        }
        for f in as_completed(future_map):
            memos[future_map[f]] = f.result()

    contrarian_memo = run_contrarian(ticker, memos, tc)
    synthesis_user = get_synthesis_user_message(ticker, memos, contrarian_memo)
    return {"system": synthesis_system(), "user": synthesis_user}
