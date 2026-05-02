"""Langfuse OTEL tracing for the Python research agent (optional; requires LANGFUSE_* keys)."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Dict, Iterator, Optional


def agent_tracing_enabled() -> bool:
    if os.getenv("LANGFUSE_AGENT_TRACING", "true").strip().lower() in ("0", "false", "no"):
        return False
    if os.getenv("LANGFUSE_TRACING_ENABLED", "true").strip().lower() in ("0", "false", "no"):
        return False
    pk = (os.getenv("LANGFUSE_PUBLIC_KEY") or "").strip()
    sk = (os.getenv("LANGFUSE_SECRET_KEY") or "").strip()
    return bool(pk and sk)


def current_trace_context() -> Optional[Dict[str, str]]:
    """Trace id + parent span id for linking observations created in worker threads."""
    if not agent_tracing_enabled():
        return None
    try:
        from opentelemetry import trace as otel_trace
        from opentelemetry.trace import format_span_id, format_trace_id

        span = otel_trace.get_current_span()
        sc = span.get_span_context()
        if not sc.is_valid:
            return None
        return {
            "trace_id": format_trace_id(sc.trace_id),
            "parent_span_id": format_span_id(sc.span_id),
        }
    except Exception:
        return None


def flush_langfuse() -> None:
    if not agent_tracing_enabled():
        return
    try:
        from langfuse import get_client

        get_client().flush()
    except Exception:
        pass


def default_openrouter_model() -> str:
    return (os.getenv("OPENROUTER_MODEL") or "anthropic/claude-sonnet-4.6").strip()


@contextmanager
def root_request_span() -> Iterator[None]:
    if not agent_tracing_enabled():
        yield
        return
    from langfuse import get_client

    with get_client().start_as_current_observation(
        name="python-research-agent",
        as_type="span",
        metadata={"runtime": "python"},
    ):
        yield


@contextmanager
def final_stream_generation() -> Iterator[None]:
    if not agent_tracing_enabled():
        yield
        return
    from langfuse import get_client

    with get_client().start_as_current_observation(
        name="openrouter-stream",
        as_type="generation",
        model=default_openrouter_model(),
        metadata={"stage": "final-report-markdown"},
    ):
        yield


def truncate_io(text: str, max_chars: int = 12000) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + f"\n\n… truncated ({len(text)} chars total)"


@contextmanager
def threaded_generation(
    *,
    name: str,
    trace_context: Optional[Dict[str, str]],
    metadata: Optional[Dict[str, Any]] = None,
    input_payload: Optional[Any] = None,
) -> Iterator[Any]:
    """LLM generation running in a ThreadPoolExecutor worker (linked via ``trace_context``)."""
    if not agent_tracing_enabled() or not trace_context:
        yield None
        return
    from langfuse import get_client

    with get_client().start_as_current_observation(
        trace_context=trace_context,
        name=name,
        as_type="generation",
        model=default_openrouter_model(),
        metadata=metadata or {},
        input=input_payload,
    ) as obs:
        yield obs


@contextmanager
def threaded_span(
    *,
    name: str,
    trace_context: Optional[Dict[str, str]],
    metadata: Optional[Dict[str, Any]] = None,
    input_payload: Optional[Any] = None,
) -> Iterator[Any]:
    """Non-LLM work in a worker thread (e.g. Tavily bundle for one ticker)."""
    if not agent_tracing_enabled() or not trace_context:
        yield None
        return
    from langfuse import get_client

    with get_client().start_as_current_observation(
        trace_context=trace_context,
        name=name,
        as_type="span",
        metadata=metadata or {},
        input=input_payload,
    ) as obs:
        yield obs
