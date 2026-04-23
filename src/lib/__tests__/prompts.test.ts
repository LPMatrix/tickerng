import { describe, it, expect } from "vitest";
import { getSystemPrompt, getUserMessage } from "../prompts";

describe("getSystemPrompt", () => {
  it("returns a string for verification mode", () => {
    const prompt = getSystemPrompt("verification");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("includes required section headers for verification", () => {
    const prompt = getSystemPrompt("verification");
    expect(prompt).toContain("### 1. Company Snapshot");
    expect(prompt).toContain("### 2. Financial Summary");
    expect(prompt).toContain("### 3. Valuation");
    expect(prompt).toContain("### 4. Catalysts");
    expect(prompt).toContain("### 5. Analyst Sentiment");
    expect(prompt).toContain("### 6. Verdict");
  });

  it("includes confidence marker format in verification prompt", () => {
    const prompt = getSystemPrompt("verification");
    expect(prompt).toContain("[High]");
    expect(prompt).toContain("[Medium]");
    expect(prompt).toContain("[Low]");
  });

  it("discovery mode includes Macro Context section when includeMacroContext is true", () => {
    const prompt = getSystemPrompt("discovery", { includeMacroContext: true });
    expect(prompt).toContain("### 1. Macro Context");
    expect(prompt).toContain("### 2. Shortlist");
  });

  it("discovery mode omits Macro Context section header when includeMacroContext is false", () => {
    const prompt = getSystemPrompt("discovery", { includeMacroContext: false });
    expect(prompt).not.toContain("### 1. Macro Context");
    expect(prompt).toContain("### 1. Shortlist");
  });

  it("discovery defaults to including macro context", () => {
    const withDefault = getSystemPrompt("discovery");
    const withExplicit = getSystemPrompt("discovery", { includeMacroContext: true });
    expect(withDefault).toBe(withExplicit);
  });

  it("discovery includes investment grade definitions", () => {
    const prompt = getSystemPrompt("discovery");
    expect(prompt).toContain("★★★★");
    expect(prompt).toContain("★★★");
  });
});

describe("getUserMessage", () => {
  it("uppercases ticker in verification mode", () => {
    const msg = getUserMessage("verification", "gtco");
    expect(msg).toContain("GTCO");
  });

  it("strips special characters from the ticker", () => {
    const msg = getUserMessage("verification", "GT.CO!");
    expect(msg).not.toContain("GT.CO");
    expect(msg).not.toContain("!");
    expect(msg).toContain("GTCO");
  });

  it("wraps discovery query in quotes", () => {
    const msg = getUserMessage("discovery", "best dividend stocks");
    expect(msg).toContain('"best dividend stocks"');
  });

  it("includes structural instruction in verification message", () => {
    const msg = getUserMessage("verification", "DANGCEM");
    expect(msg).toContain("verification report");
    expect(msg).toContain("DANGCEM");
  });

  it("includes structural instruction in discovery message", () => {
    const msg = getUserMessage("discovery", "banking sector");
    expect(msg).toContain("discovery report");
    expect(msg).toContain("3–5 stocks");
  });
});
