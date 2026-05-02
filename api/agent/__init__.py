"""NGX research agent: Tavily + OpenRouter pipeline.

Package layout:
  ``config`` — constants and URLs
  ``llm`` — OpenRouter
  ``search`` — Tavily
  ``prompts`` — narrative prompts (Langfuse + fallbacks)
  ``stages`` — discovery / verification pipeline
  ``observability`` — tracing
  ``server`` — Vercel HTTP entry (``handler``)
"""
