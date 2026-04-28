import { after, NextRequest, NextResponse } from "next/server";
import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { observe, setActiveTraceIO } from "@langfuse/tracing";
import { auth } from "@clerk/nextjs/server";
import { getSystemPrompt, getUserMessage } from "@/lib/prompts";
import type { ResearchMode } from "@/lib/prompts";
import {
  SPECIALIST_KEYS,
  type SpecialistKey,
  getSpecialistSystemPrompt,
  getSpecialistUserMessage,
  getSynthesisSystemPrompt,
  getSynthesisUserMessage,
} from "@/lib/specialists";
import {
  tavilySearchToMarkdown,
  buildSpecialistWebContext,
  buildDiscoveryTickerEnrichmentMarkdown,
  discoveryTavilyQueries,
  discoveryTavilyOptions,
} from "@/lib/tavily";
import { extractDiscoveryCandidateTickers } from "@/lib/discovery-enrichment";
import { langfuseSpanProcessor } from "@/instrumentation";
import { checkVerificationQuota } from "@/lib/billing";

const OPENROUTER_PROMPT_CACHE_ENABLED =
  process.env.OPENROUTER_PROMPT_CACHE_ENABLED?.trim().toLowerCase() !== "false";
const OPENROUTER_PROMPT_CACHE_TTL =
  process.env.OPENROUTER_PROMPT_CACHE_TTL?.trim().toLowerCase() === "1h" ? "1h" : "5m";

function withOpenRouterPromptCache(init?: RequestInit): RequestInit | undefined {
  if (!OPENROUTER_PROMPT_CACHE_ENABLED || !init?.body || typeof init.body !== "string") {
    return init;
  }

  try {
    const payload = JSON.parse(init.body) as Record<string, unknown>;
    const model = typeof payload.model === "string" ? payload.model : "";
    if (!model.startsWith("anthropic/")) {
      return init;
    }

    // Anthropic prompt caching on OpenRouter: set top-level cache_control.
    // We only set it when absent so call sites can still override in future.
    if (!payload.cache_control) {
      payload.cache_control =
        OPENROUTER_PROMPT_CACHE_TTL === "1h"
          ? { type: "ephemeral", ttl: "1h" }
          : { type: "ephemeral" };
    }

    return {
      ...init,
      body: JSON.stringify(payload),
    };
  } catch {
    return init;
  }
}

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  fetch: async (input, init) => fetch(input, withOpenRouterPromptCache(init)),
});
const OPENROUTER_MODEL_ID =
  process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4.6";
const MODEL = openrouter(OPENROUTER_MODEL_ID);

function normalizeTicker(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

async function runSpecialist(
  tavilyApiKey: string,
  key: SpecialistKey,
  ticker: string
): Promise<string> {
  const label =
    key === "fundamentals"
      ? "Fundamentals"
      : key === "news"
        ? "News"
        : key === "macro"
          ? "Macro"
          : "Sentiment";
  try {
    const searchMd = await buildSpecialistWebContext(tavilyApiKey, ticker, key);
    const userContent = `${getSpecialistUserMessage(ticker, key)}\n\n${searchMd}`;
    const { text } = await generateText({
      model: MODEL,
      system: getSpecialistSystemPrompt(key),
      messages: [{ role: "user", content: userContent }],
      maxOutputTokens: 4096,
      experimental_telemetry: {
        isEnabled: true,
        functionId: `specialist-${key}`,
        metadata: { ticker, specialist: key },
      },
    });
    if (!text) {
      return `### ${label} specialist\n\nNo text returned from model.\n\n[Low] — empty specialist response`;
    }
    return text;
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    return `### ${label} specialist failed\n\n${m}\n\n[Low] — specialist API error`;
  }
}

const handler = async (request: NextRequest): Promise<NextResponse> => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[research] Service misconfiguration: language model provider is not available");
    return NextResponse.json(
      { error: "Research is temporarily unavailable. Please try again in a few minutes." },
      { status: 503 }
    );
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
  if (!tavilyApiKey) {
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
      return NextResponse.json(
        { error: "Missing or invalid query" },
        { status: 400 }
      );
    }

    setActiveTraceIO({ input: { mode, query } });

    if (mode === "verification") {
      const ticker = normalizeTicker(query);
      if (!ticker) {
        return NextResponse.json(
          { error: "Missing or invalid ticker" },
          { status: 400 }
        );
      }

      const quota = await checkVerificationQuota(userId);
      if (!quota.allowed) {
        return NextResponse.json(
          { error: "Monthly verification limit reached", quota: { limit: quota.limit, used: quota.used } },
          { status: 402 }
        );
      }

      const results = await Promise.all(
        SPECIALIST_KEYS.map((key) => runSpecialist(tavilyApiKey, key, ticker))
      );
      const memos = Object.fromEntries(
        SPECIALIST_KEYS.map((k, i) => [k, results[i]])
      ) as Record<SpecialistKey, string>;

      const result = streamText({
        model: MODEL,
        system: getSynthesisSystemPrompt(),
        messages: [{ role: "user", content: getSynthesisUserMessage(ticker, memos) }],
        maxOutputTokens: 8192,
        experimental_telemetry: {
          isEnabled: true,
          functionId: "synthesis",
          metadata: { ticker },
        },
        onError({ error }) {
          console.error("[synthesis stream error]", error);
        },
      });

      after(async () => await langfuseSpanProcessor?.forceFlush());
      return result.toTextStreamResponse() as NextResponse;
    }

    const systemPrompt = getSystemPrompt(mode, { includeMacroContext });
    const baseUserMessage = getUserMessage(mode, query);
    const discoveryQueries = discoveryTavilyQueries(query, includeMacroContext);
    const discoveryBlocks = await Promise.all(
      discoveryQueries.map((q, i) =>
        tavilySearchToMarkdown(tavilyApiKey, q, {
          ...discoveryTavilyOptions(i),
          sectionHeading:
            i === 0 ? "Web search: your query (NGX-focused)" : "Web search: macro & NGX market",
        })
      )
    );
    const initialWebMarkdown = discoveryBlocks.join("\n\n");

    let userMessage = `${baseUserMessage}\n\n${initialWebMarkdown}`;
    let discoveryEnrichmentTickers = "";
    try {
      const candidateTickers = await extractDiscoveryCandidateTickers(
        MODEL,
        query,
        initialWebMarkdown
      );
      if (candidateTickers.length > 0) {
        discoveryEnrichmentTickers = candidateTickers.join(",");
        const perTicker = await Promise.all(
          candidateTickers.map(async (t) => {
            try {
              const md = await buildDiscoveryTickerEnrichmentMarkdown(tavilyApiKey, t);
              return `### Per-ticker excerpts: ${t}\n\n${md}`;
            } catch (e) {
              const m = e instanceof Error ? e.message : String(e);
              return `### Per-ticker excerpts: ${t}\n\n_(Enrichment failed: ${m})_`;
            }
          })
        );
        userMessage = `${baseUserMessage}\n\n${initialWebMarkdown}\n\n---\n\n**Per-ticker web excerpts** (prefer these blocks for price, volume, market cap, P/E, and filing snippets when present; the sections above are broader discovery context):\n\n${perTicker.join("\n\n")}`;
      }
    } catch {
      /* fall back to single-stage discovery */
    }

    const result = streamText({
      model: MODEL,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxOutputTokens: 8192,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "discovery",
        metadata: {
          query,
          ...(discoveryEnrichmentTickers ? { discoveryEnrichmentTickers } : {}),
        },
      },
      onError({ error }) {
        console.error("[discovery stream error]", error);
      },
    });

    after(async () => await langfuseSpanProcessor?.forceFlush());
    return result.toTextStreamResponse() as NextResponse;
  } catch (err) {
    console.error("[research] Unhandled error", err);
    const status =
      err && typeof err === "object" && "status" in err && typeof (err as { status: number }).status === "number"
        ? (err as { status: number }).status
        : 500;
    const code = status >= 400 && status < 600 ? status : 500;
    return NextResponse.json(
      {
        error:
          "We couldn't complete that research request. Please try again. If it keeps happening, contact support.",
      },
      { status: code }
    );
  }
};

export const POST = observe(handler, { name: "research-pipeline", endOnExit: false });
