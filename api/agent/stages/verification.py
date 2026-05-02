"""Verification mode: parallel specialists + synthesis prompt."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Optional

from langfuse import observe

from agent.config.constants import SPECIALIST_KEYS
from agent.llm.openrouter import model_for, openrouter_generate
from agent.observability.tracing import current_trace_context, threaded_generation, truncate_io
from agent.prompts.prompt_resolve import synthesis_system
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

    synthesis_user = get_synthesis_user_message(ticker, memos)
    return {"system": synthesis_system(), "user": synthesis_user}
