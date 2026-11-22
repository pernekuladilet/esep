import { describe, expect, it } from "vitest";
import { getDailyLimit, isOverLimit } from "@/lib/assistant/limits";

describe("getDailyLimit", () => {
  it("returns the configured limit for free and pro", () => {
    expect(getDailyLimit("free")).toBe(5);
    expect(getDailyLimit("pro")).toBe(50);
  });

  it("returns null (unlimited) for business", () => {
    expect(getDailyLimit("business")).toBeNull();
  });
});

describe("isOverLimit", () => {
  it("is false below the limit and true at or above it", () => {
    expect(isOverLimit(4, 5)).toBe(false);
    expect(isOverLimit(5, 5)).toBe(true);
    expect(isOverLimit(6, 5)).toBe(true);
  });

  it("is never over limit when the limit is null", () => {
    expect(isOverLimit(0, null)).toBe(false);
    expect(isOverLimit(1_000_000, null)).toBe(false);
  });
});
