import { NextRequest, NextResponse } from "next/server";
import { observe } from "@langfuse/tracing";
import { auth } from "@clerk/nextjs/server";
import { checkVerificationQuota } from "@/lib/billing";
import { resolveResearchAgentEndpoint } from "@/lib/research-agent-url";

type ResearchMode = "discovery" | "verification";

/** Avoid default platform/route timeouts cutting off long streamed reports (OpenRouter SSE). */
export const maxDuration = 300;

function normalizeTicker(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

const handler = async (request: NextRequest): Promise<NextResponse> => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    console.error("[research] Service misconfiguration: language model provider is not available");
    return NextResponse.json(
      { error: "Research is temporarily unavailable. Please try again in a few minutes." },
      { status: 503 }
    );
  }
  if (!process.env.TAVILY_API_KEY?.trim()) {
    console.error("[research] Service misconfiguration: web search provider is not available");
    return NextResponse.json(
      { error: "Research is temporarily unavailable. Please try again in a few minutes." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const mode = (body.mode === "discovery" ? "discovery" : "verification") as ResearchMode;
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const includeMacroContext = mode === "discovery" && body.includeMacroContext !== false;

    if (!query) {
      return NextResponse.json({ error: "Missing or invalid query" }, { status: 400 });
    }

    if (mode === "verification") {
      const ticker = normalizeTicker(query);
      if (!ticker) {
        return NextResponse.json({ error: "Missing or invalid ticker" }, { status: 400 });
      }
      const quota = await checkVerificationQuota(userId);
      if (!quota.allowed) {
        return NextResponse.json(
          { error: "Monthly verification limit reached", quota: { limit: quota.limit, used: quota.used } },
          { status: 402 }
        );
      }
    }

    const agentUrl = resolveResearchAgentEndpoint(request);
    if (!agentUrl) {
      console.error(
        "[research] Research agent URL could not be resolved. Set RESEARCH_AGENT_URL or run the local Python agent (npm run dev)."
      );
      return NextResponse.json(
        {
          error: "Research is temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    const agentHeaders = new Headers({
      "Content-Type": "application/json",
    });
    const cookie = request.headers.get("cookie");
    if (cookie) agentHeaders.set("cookie", cookie);
    const authorization = request.headers.get("authorization");
    if (authorization) agentHeaders.set("authorization", authorization);
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
    if (bypass) {
      agentHeaders.set("x-vercel-protection-bypass", bypass);
    }

    let upstream: Response;
    try {
      upstream = await fetch(agentUrl, {
        method: "POST",
        headers: agentHeaders,
        body: JSON.stringify({ mode, query, includeMacroContext }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const refused =
        typeof msg === "string" &&
        (msg.includes("ECONNREFUSED") || msg.includes("fetch failed"));
      console.error("[research] Agent fetch failed:", msg);
      return NextResponse.json(
        {
          error: refused
            ? "Research agent is not running. Use `npm run dev` (starts Next + Python), or start the agent and set RESEARCH_AGENT_URL."
            : "Research is temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    if (upstream.status === 404) {
      console.error("[research] Agent returned 404 — check RESEARCH_AGENT_URL and the agent process.");
      return NextResponse.json(
        {
          error: "Research is temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    if (!upstream.ok) {
      let errorMessage = "Research request failed";
      try {
        const data = (await upstream.json()) as { error?: string };
        if (typeof data.error === "string" && data.error.trim()) errorMessage = data.error;
      } catch {
        try {
          const text = await upstream.text();
          if (text.trim()) errorMessage = text;
        } catch {
          // keep default
        }
      }
      return NextResponse.json(
        {
          error:
            errorMessage ||
            "We couldn't complete that research request. Please try again. If it keeps happening, contact support.",
        },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 500 }
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[research] Unhandled error", err);
    return NextResponse.json(
      {
        error:
          "We couldn't complete that research request. Please try again. If it keeps happening, contact support.",
      },
      { status: 500 }
    );
  }
};

export const POST = observe(handler, { name: "research-pipeline", endOnExit: false });
