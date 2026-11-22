import { describe, expect, it } from "vitest";
import {
  getHalfYear,
  getPeriodRange,
  getDeadlines,
  calculateTax,
  getIncomeLimitProgress,
  daysUntil,
} from "@/lib/tax/calculate";

describe("getHalfYear", () => {
  it("puts June 30 in the first half and July 1 in the second", () => {
    expect(getHalfYear(new Date(2026, 5, 30))).toEqual({ year: 2026, half: 1 });
    expect(getHalfYear(new Date(2026, 6, 1))).toEqual({ year: 2026, half: 2 });
  });

  it("puts December 31 in the second half of its own year, January 1 in the first half of the next", () => {
    expect(getHalfYear(new Date(2026, 11, 31))).toEqual({ year: 2026, half: 2 });
    expect(getHalfYear(new Date(2027, 0, 1))).toEqual({ year: 2027, half: 1 });
  });
});

describe("getPeriodRange", () => {
  it("covers Jan 1 - Jun 30 for the first half", () => {
    expect(getPeriodRange(2026, 1)).toEqual({ startIso: "2026-01-01", endIso: "2026-06-30" });
  });

  it("covers Jul 1 - Dec 31 for the second half", () => {
    expect(getPeriodRange(2026, 2)).toEqual({ startIso: "2026-07-01", endIso: "2026-12-31" });
  });
});

describe("getDeadlines", () => {
  it("places the first half's deadlines in August of the same year", () => {
    const { reportDate, payDate } = getDeadlines(2026, 1);
    expect(reportDate).toEqual(new Date(2026, 7, 15));
    expect(payDate).toEqual(new Date(2026, 7, 25));
  });

  it("rolls the second half's deadlines into February of the following year", () => {
    const { reportDate, payDate } = getDeadlines(2026, 2);
    expect(reportDate).toEqual(new Date(2027, 1, 15));
    expect(payDate).toEqual(new Date(2027, 1, 25));
  });
});

describe("calculateTax", () => {
  it("computes 2%, 4% and 6% of the same income", () => {
    const incomeTiyn = 1_000_000_00; // 1,000,000 ₸
    expect(calculateTax(incomeTiyn, 2)).toBe(20_000_00);
    expect(calculateTax(incomeTiyn, 4)).toBe(40_000_00);
    expect(calculateTax(incomeTiyn, 6)).toBe(60_000_00);
  });

  it("is zero for zero income", () => {
    expect(calculateTax(0, 4)).toBe(0);
  });

  it("rounds to the nearest tiyn", () => {
    expect(calculateTax(333, 4)).toBe(13); // 13.32 -> 13
  });
});

describe("getIncomeLimitProgress", () => {
  it("does not warn below 80% of the limit", () => {
    const result = getIncomeLimitProgress(Math.round(259_500_000_000 * 0.79));
    expect(result.warnAt80).toBe(false);
    expect(result.exceeded).toBe(false);
  });

  it("warns at exactly 80%", () => {
    const result = getIncomeLimitProgress(259_500_000_000 * 0.8);
    expect(result.warnAt80).toBe(true);
    expect(result.exceeded).toBe(false);
  });

  it("flags as exceeded at 100% and beyond", () => {
    expect(getIncomeLimitProgress(259_500_000_000).exceeded).toBe(true);
    expect(getIncomeLimitProgress(259_500_000_000 * 1.2).exceeded).toBe(true);
  });
});

describe("daysUntil", () => {
  it("counts whole days forward and backward from a fixed point", () => {
    const from = new Date(2026, 10, 22);
    expect(daysUntil(new Date(2026, 10, 25), from)).toBe(3);
    expect(daysUntil(new Date(2026, 10, 20), from)).toBe(-2);
    expect(daysUntil(new Date(2026, 10, 22), from)).toBe(0);
  });
});
