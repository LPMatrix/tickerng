import { describe, it, expect } from "vitest";
import {
  SPECIALIST_KEYS,
  getSpecialistSystemPrompt,
  getSpecialistUserMessage,
  getSynthesisSystemPrompt,
  getSynthesisUserMessage,
} from "../specialists";

describe("SPECIALIST_KEYS", () => {
  it("contains the four expected keys", () => {
    expect(SPECIALIST_KEYS).toEqual(["fundamentals", "news", "macro", "sentiment"]);
  });
});

describe("getSpecialistSystemPrompt", () => {
  it("returns a non-empty string for every key", () => {
    for (const key of SPECIALIST_KEYS) {
      const prompt = getSpecialistSystemPrompt(key);
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it("fundamentals prompt covers company snapshot and valuation", () => {
    const prompt = getSpecialistSystemPrompt("fundamentals");
    expect(prompt).toContain("fundamentals");
    expect(prompt).toContain("valuation");
  });

  it("news prompt covers corporate actions", () => {
    const prompt = getSpecialistSystemPrompt("news");
    expect(prompt).toContain("corporate action");
  });

  it("macro prompt covers CBN and inflation", () => {
    const prompt = getSpecialistSystemPrompt("macro");
    expect(prompt).toContain("CBN");
    expect(prompt).toContain("inflation");
  });

  it("all prompts include confidence marker instruction", () => {
    for (const key of SPECIALIST_KEYS) {
      const prompt = getSpecialistSystemPrompt(key);
      expect(prompt).toContain("[High]");
      expect(prompt).toContain("[Medium]");
      expect(prompt).toContain("[Low]");
    }
  });

  it("all prompts instruct not to fabricate data", () => {
    for (const key of SPECIALIST_KEYS) {
      const prompt = getSpecialistSystemPrompt(key);
      expect(prompt).toContain("Data not found");
    }
  });
});

describe("getSpecialistUserMessage", () => {
  it("uppercases the ticker", () => {
    const msg = getSpecialistUserMessage("gtco", "fundamentals");
    expect(msg).toContain("GTCO");
    expect(msg).not.toContain("gtco");
  });

  it("includes the specialist type name", () => {
    const msg = getSpecialistUserMessage("MTNN", "news");
    expect(msg.toLowerCase()).toContain("news");
  });

  it("produces distinct messages for each specialist", () => {
    const messages = SPECIALIST_KEYS.map((k) => getSpecialistUserMessage("DANGCEM", k));
    const unique = new Set(messages);
    expect(unique.size).toBe(SPECIALIST_KEYS.length);
  });
});

describe("getSynthesisSystemPrompt", () => {
  it("returns a non-empty string", () => {
    const prompt = getSynthesisSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("includes all six required section headers", () => {
    const prompt = getSynthesisSystemPrompt();
    expect(prompt).toContain("### 1. Company Snapshot");
    expect(prompt).toContain("### 2. Financial Summary");
    expect(prompt).toContain("### 3. Valuation");
    expect(prompt).toContain("### 4. Catalysts");
    expect(prompt).toContain("### 5. Analyst Sentiment");
    expect(prompt).toContain("### 6. Verdict");
  });
});

describe("getSynthesisUserMessage", () => {
  const memos = {
    fundamentals: "Fundamentals memo content",
    news: "News memo content",
    macro: "Macro memo content",
    sentiment: "Sentiment memo content",
  };

  it("uppercases the ticker", () => {
    const msg = getSynthesisUserMessage("gtco", memos);
    expect(msg).toContain("GTCO");
  });

  it("includes all four memo contents", () => {
    const msg = getSynthesisUserMessage("GTCO", memos);
    expect(msg).toContain("Fundamentals memo content");
    expect(msg).toContain("News memo content");
    expect(msg).toContain("Macro memo content");
    expect(msg).toContain("Sentiment memo content");
  });
});
