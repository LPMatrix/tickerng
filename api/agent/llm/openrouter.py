"""OpenRouter chat completions (blocking + SSE stream)."""

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

from agent.config.constants import OPENROUTER_CHAT_URL
from agent.llm.openrouter_helpers import (
    attach_top_level_prompt_cache_if_enabled,
    openrouter_http_error_detail,
)


def openrouter_generate(system: str, user_content: str, max_tokens: int, temperature: Optional[float] = None) -> str:
    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    model = (os.getenv("OPENROUTER_MODEL") or "anthropic/claude-sonnet-4.6").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
    }
    if temperature is not None:
        payload["temperature"] = temperature

    attach_top_level_prompt_cache_if_enabled(payload)

    req = urllib.request.Request(
        OPENROUTER_CHAT_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenRouter error: {openrouter_http_error_detail(e)}") from e
    except Exception as e:
        raise RuntimeError(f"OpenRouter error: {e}") from e

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("No choices returned from model")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        text_chunks = [c.get("text", "") for c in content if isinstance(c, dict)]
        return "".join(text_chunks).strip()
    return (content or "").strip()


def openrouter_stream_generate(
    system: str,
    user_content: str,
    max_tokens: int,
    temperature: Optional[float] = None,
):
    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    model = (os.getenv("OPENROUTER_MODEL") or "anthropic/claude-sonnet-4.6").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured")

    payload: Dict[str, Any] = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
        "stream": True,
    }
    if temperature is not None:
        payload["temperature"] = temperature

    attach_top_level_prompt_cache_if_enabled(payload)

    req = urllib.request.Request(
        OPENROUTER_CHAT_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )

    stream_timeout = int(os.getenv("OPENROUTER_STREAM_READ_TIMEOUT", "600"))

    try:
        with urllib.request.urlopen(req, timeout=stream_timeout) as res:
            for raw_line in res:
                line = raw_line.decode("utf-8", errors="ignore").strip()
                if not line or not line.startswith("data:"):
                    continue
                data_str = line[5:].strip()
                if data_str == "[DONE]":
                    break
                try:
                    event = json.loads(data_str)
                except Exception:
                    continue
                choices = event.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                content = delta.get("content")
                if isinstance(content, str) and content:
                    yield content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            txt = item.get("text")
                            if isinstance(txt, str) and txt:
                                yield txt
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"OpenRouter error: {openrouter_http_error_detail(e)}") from e
    except Exception as e:
        raise RuntimeError(f"OpenRouter error: {e}") from e
