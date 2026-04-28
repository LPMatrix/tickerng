import importlib.util
from pathlib import Path


_impl_path = Path(__file__).with_name("research-agent.py")
_spec = importlib.util.spec_from_file_location("research_agent_impl", _impl_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Unable to load research agent implementation from {_impl_path}")
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

handler = _module.handler
