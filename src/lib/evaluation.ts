import { generateText, Output } from "ai";
import { z } from "zod";

const JUDGE_MODEL = "anthropic/claude-haiku-4.5";

export const EvaluationSchema = z.object({
  sourceGrounding: z.number().min(1).max(5),
  confidenceCalibration: z.number().min(1).max(5),
  completeness: z.number().min(1).max(5),
  fabricationRisk: z.number().min(1).max(5),
  overallScore: z.number().min(1).max(5),
  strengths: z.array(z.string()).max(3),
  weaknesses: z.array(z.string()).max(3),
  verdict: z.enum(["pass", "needs_review", "fail"]),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;

const JUDGE_SYSTEM = `
You are an independent quality auditor for TickerNG, a Nigerian Exchange (NGX) stock research platform.
You receive a completed research report and score it on four dimensions. All scores are 1–5.

Scoring rubrics:
- sourceGrounding: 5 = every factual claim has a cited source or stated basis; 1 = claims made with no sourcing
- confidenceCalibration: 5 = [High/Medium/Low] markers are precisely justified and consistent; 1 = labels appear arbitrary or missing
- completeness: 5 = all required sections (Company Snapshot, Financial Summary, Valuation, Catalysts, Analyst Sentiment, Verdict) are present and substantive; 1 = major sections missing
- fabricationRisk: 5 = no suspicious figures without sources; 1 = specific numbers cited with no traceable source

Verdict:
- "pass" if overallScore >= 4
- "needs_review" if overallScore >= 3
- "fail" if overallScore < 3

Be strict. A [High] confidence claim with no sources is a calibration failure. Vague phrases like "according to available data" without a named source are fabrication risks. Limit strengths and weaknesses to the 2–3 most significant.
`.trim();

export async function evaluateReport(content: string): Promise<Evaluation> {
  const { output } = await generateText({
    model: JUDGE_MODEL,
    system: JUDGE_SYSTEM,
    output: Output.object({ schema: EvaluationSchema }),
    messages: [
      {
        role: "user",
        content: `Score the following TickerNG research report:\n\n${content}`,
      },
    ],
    maxOutputTokens: 1024,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "evaluation-judge",
    },
  });
  return output;
}
