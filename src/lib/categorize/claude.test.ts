import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { categorizeWithClaude } from "./claude";

describe("categorizeWithClaude", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("falls back to 'other' for every item when no API key is configured", async () => {
    const result = await categorizeWithClaude([
      { index: 0, description: "Жанна К.", type: "expense" },
      { index: 1, description: "Unknown Merchant", type: "expense" },
    ]);

    expect(result.get(0)).toBe("other");
    expect(result.get(1)).toBe("other");
  });

  it("returns an empty map for no items without touching the network", async () => {
    const result = await categorizeWithClaude([]);
    expect(result.size).toBe(0);
  });
});
