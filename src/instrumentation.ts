import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export let langfuseSpanProcessor: LangfuseSpanProcessor | null = null;

export function register() {
  if (process.env.LANGFUSE_SECRET_KEY) {
    langfuseSpanProcessor = new LangfuseSpanProcessor();
    const tracerProvider = new NodeTracerProvider({
      spanProcessors: [langfuseSpanProcessor],
    });
    tracerProvider.register();
  }
}
