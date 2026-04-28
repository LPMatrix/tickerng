"""OpenRouter error parsing, optional prompt cache, stream failure copy."""

import json
import os
import urllib.error
from typing import Any, Dict


def openrouter_http_error_detail(e: urllib.error.HTTPError) -> str:
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


def attach_top_level_prompt_cache_if_enabled(payload: Dict[str, Any]) -> None:
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


def stream_failure_user_message(exc: BaseException) -> str:
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
