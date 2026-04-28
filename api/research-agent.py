"""Vercel Python entry — implementation lives in ``agent`` package."""

import sys
from pathlib import Path

_api_dir = Path(__file__).resolve().parent
if str(_api_dir) not in sys.path:
    sys.path.insert(0, str(_api_dir))

from agent.handler import handler as _HandlerBase


class handler(_HandlerBase):  # noqa: N801 — name required by Vercel Python runtime
    """Declared here so Vercel’s build finds a top-level ``handler`` in this file."""

    pass
