"""Vercel Python serverless entry: POST JSON → streamed Markdown."""

import json
import traceback
from http.server import BaseHTTPRequestHandler
from typing import Any

from agent.llm.openrouter import model_for, openrouter_stream_generate
from agent.llm.openrouter_helpers import stream_failure_user_message
from agent.observability.tracing import final_stream_generation, flush_langfuse, root_request_span
from agent.server.http_utils import json_response
from agent.stages.pipeline import process_request


class handler(BaseHTTPRequestHandler):  # noqa: N801 — Vercel expects this name
    def do_POST(self) -> None:
        with root_request_span():
            try:
                try:
                    content_length = int(self.headers.get("content-length", 0))
                    raw = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
                    payload = json.loads(raw or "{}")
                    prompt = process_request(payload)
                except ValueError as e:
                    json_response(self, 400, {"error": str(e)})
                    return
                except RuntimeError as e:
                    json_response(self, 503, {"error": str(e)})
                    return
                except Exception:
                    json_response(self, 500, {"error": "Research request failed"})
                    return

                self.send_response(200)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, no-transform")
                self.end_headers()

                try:
                    streamed_any = False
                    synthesis_model = model_for("synthesis")
                    with final_stream_generation(model=synthesis_model):
                        for chunk in openrouter_stream_generate(
                            prompt["system"],
                            prompt["user"],
                            max_tokens=8192,
                            model=synthesis_model,
                        ):
                            streamed_any = True
                            self.wfile.write(chunk.encode("utf-8"))
                            self.wfile.flush()

                    if not streamed_any:
                        self.wfile.write(b"## Error\n\nNo content returned from model.")
                        self.wfile.flush()
                except BrokenPipeError:
                    return
                except ConnectionResetError:
                    return
                except Exception as e:
                    traceback.print_exc()
                    try:
                        msg = stream_failure_user_message(e)
                        self.wfile.write(f"\n\n## Error\n\n{msg}".encode("utf-8"))
                        self.wfile.flush()
                    except BrokenPipeError:
                        return
            finally:
                flush_langfuse()

    def log_message(self, format: str, *args: Any) -> None:
        return
