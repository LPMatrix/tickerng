import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";
import { auth } from "@/auth";
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

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;
const WEB_SEARCH_MAX_USES = 10;
const SPECIALIST_MAX_TOKENS = 4096;
const SPECIALIST_WEB_SEARCH_MAX_USES = 4;

function extractMessageText(message: Message): string {
  return message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function normalizeTicker(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

async function runSpecialist(
  anthropic: Anthropic,
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
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: SPECIALIST_MAX_TOKENS,
      system: getSpecialistSystemPrompt(key),
      messages: [
        { role: "user", content: getSpecialistUserMessage(ticker, key) },
      ],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: SPECIALIST_WEB_SEARCH_MAX_USES,
        },
      ] as never,
    });
    const text = extractMessageText(msg);
    if (!text) {
      return `### ${label} specialist\n\nNo text returned from model.\n\n[Low] — empty specialist response`;
    }
    return text;
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    return `### ${label} specialist failed\n\n${m}\n\n[Low] — specialist API error`;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
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

    const anthropic = new Anthropic({ apiKey });

    if (mode === "verification") {
      const ticker = normalizeTicker(query);
      if (!ticker) {
        return NextResponse.json(
          { error: "Missing or invalid ticker" },
          { status: 400 }
        );
      }

      const results = await Promise.all(
        SPECIALIST_KEYS.map((key) => runSpecialist(anthropic, key, ticker))
      );
      const memos = Object.fromEntries(
        SPECIALIST_KEYS.map((k, i) => [k, results[i]])
      ) as Record<SpecialistKey, string>;

      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: getSynthesisSystemPrompt(),
        messages: [
          {
            role: "user",
            content: getSynthesisUserMessage(ticker, memos),
          },
        ],
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              }
            }
            controller.close();
          } catch (err) {
            const message = err instanceof Error ? err.message : "Stream error";
            controller.enqueue(encoder.encode(`\x00ERROR\x00${message}`));
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-store",
          "X-EquiScan-Pipeline": "specialists-v3",
        },
      });
    }

    const systemPrompt = getSystemPrompt(mode, { includeMacroContext });
    const userMessage = getUserMessage(mode, query);

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: WEB_SEARCH_MAX_USES },
      ] as never,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`\x00ERROR\x00${message}`)
          );
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
        "X-EquiScan-Pipeline": "discovery",
      },
    });
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
}
