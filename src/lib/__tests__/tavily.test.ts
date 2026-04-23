import { describe, it, expect, vi, afterEach } from "vitest";
import { tavilySearchToMarkdown, discoveryTavilyQueries, discoveryTavilyOptions } from "../tavily";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("discoveryTavilyQueries", () => {
  it("returns one query when macro is excluded", () => {
    const queries = discoveryTavilyQueries("dividend stocks", false);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain("dividend stocks");
  });

  it("returns two queries when macro is included", () => {
    const queries = discoveryTavilyQueries("banking sector", true);
    expect(queries).toHaveLength(2);
  });

  it("primary query includes NGX disambiguation", () => {
    const queries = discoveryTavilyQueries("top picks", true);
    expect(queries[0]).toMatch(/NGX|Nigerian Exchange/);
  });

  it("macro query mentions CBN and inflation", () => {
    const queries = discoveryTavilyQueries("energy stocks", true);
    expect(queries[1]).toContain("CBN");
    expect(queries[1]).toContain("inflation");
  });
});

describe("discoveryTavilyOptions", () => {
  it("index 0 returns more results than index 1", () => {
    const opts0 = discoveryTavilyOptions(0);
    const opts1 = discoveryTavilyOptions(1);
    expect(opts0.maxResults!).toBeGreaterThan(opts1.maxResults!);
  });

  it("always targets nigeria", () => {
    expect(discoveryTavilyOptions(0).country).toBe("nigeria");
    expect(discoveryTavilyOptions(1).country).toBe("nigeria");
  });

  it("excludes global noise domains", () => {
    const opts = discoveryTavilyOptions(0);
    expect(opts.excludeDomains).toContain("finance.yahoo.com");
  });
});

describe("tavilySearchToMarkdown", () => {
  it("returns empty-query placeholder without fetching", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const result = await tavilySearchToMarkdown("key", "  ");
    expect(result).toContain("No query provided");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses the sectionHeading option in the output", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as unknown as Response);

    const result = await tavilySearchToMarkdown("key", "GTCO NGX", {
      sectionHeading: "Custom Heading",
    });
    expect(result).toContain("## Custom Heading");
  });

  it("renders a result row for each returned item", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { title: "First result", url: "https://example.com/1", content: "Content A" },
          { title: "Second result", url: "https://example.com/2", content: "Content B" },
        ],
      }),
    } as unknown as Response);

    const result = await tavilySearchToMarkdown("key", "DANGCEM NGX");
    expect(result).toContain("First result");
    expect(result).toContain("Content A");
    expect(result).toContain("Second result");
    expect(result).toContain("Content B");
  });

  it("returns no-results placeholder when results array is empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as unknown as Response);

    const result = await tavilySearchToMarkdown("key", "MTNN NGX");
    expect(result).toContain("No results returned");
  });

  it("returns failure placeholder on non-OK response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "Invalid API key" }),
    } as unknown as Response);

    const result = await tavilySearchToMarkdown("badkey", "test query");
    expect(result).toContain("Search failed");
    expect(result).toContain("401");
  });

  it("includes published date when present in result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "With date",
            url: "https://nairametrics.com/gtco",
            content: "Some content",
            published_date: "2025-01-15",
          },
        ],
      }),
    } as unknown as Response);

    const result = await tavilySearchToMarkdown("key", "GTCO");
    expect(result).toContain("2025-01-15");
  });
});
