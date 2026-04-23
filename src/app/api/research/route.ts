import { after, NextRequest, NextResponse } from "next/server";
import { generateText, streamText } from "ai";
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
  discoveryTavilyQueries,
  discoveryTavilyOptions,
} from "@/lib/tavily";
import { langfuseSpanProcessor } from "@/instrumentation";
import { checkVerificationQuota } from "@/lib/billing";

const MODEL = "anthropic/claude-sonnet-4.6";

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

  if (!process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      { error: "AI Gateway auth not configured — run `vercel env pull` to provision VERCEL_OIDC_TOKEN" },
      { status: 503 }
    );
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();
  if (!tavilyApiKey) {
    return NextResponse.json(
      { error: "TAVILY_API_KEY is not configured" },
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
          { error: "Monthly verification limit reached", quota },
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
    const userMessage = `${baseUserMessage}\n\n${discoveryBlocks.join("\n\n")}`;

    const result = streamText({
      model: MODEL,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxOutputTokens: 8192,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "discovery",
        metadata: { query },
      },
      onError({ error }) {
        console.error("[discovery stream error]", error);
      },
    });

    after(async () => await langfuseSpanProcessor?.forceFlush());
    return result.toTextStreamResponse() as NextResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research request failed";
    const status =
      err && typeof err === "object" && "status" in err && typeof (err as { status: number }).status === "number"
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
};

export const POST = observe(handler, { name: "research-pipeline", endOnExit: false });
