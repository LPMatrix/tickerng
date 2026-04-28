"""Local HTTP server for the research agent — run via `npm run dev` alongside Next.js."""

from __future__ import annotations

import importlib.util
import os
from http.server import HTTPServer
from pathlib import Path


def _load_handler():
    root = Path(__file__).resolve().parent
    spec_path = root / "research_agent.py"
    spec = importlib.util.spec_from_file_location("vercel_research_agent", spec_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {spec_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.handler


def main() -> None:
    Handler = _load_handler()
    host = os.environ.get("RESEARCH_AGENT_HOST", "127.0.0.1")
    port = int(os.environ.get("RESEARCH_AGENT_PORT", "8788"))
    httpd = HTTPServer((host, port), Handler)
    print(f"[research-agent] POST http://{host}:{port}/", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
