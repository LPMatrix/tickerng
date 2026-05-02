import { LangfuseSpanProcessor } from "@langfuse/otel";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export let langfuseSpanProcessor: LangfuseSpanProcessor | null = null;

export function register() {
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  // OTLP export uses Basic auth (public + secret). Either missing → Langfuse warns and traces fail.
  if (!secretKey || !publicKey) {
    return;
  }
  langfuseSpanProcessor = new LangfuseSpanProcessor({ publicKey, secretKey });
  const tracerProvider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
    resource: resourceFromAttributes({
      "service.name": "tickerng-next",
    }),
  });
  tracerProvider.register();
}
