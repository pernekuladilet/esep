import { describe, expect, it } from "vitest";
import { markDuplicates } from "./dedup";
import type { ParsedRow } from "@/lib/parsers/types";

function row(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return {
    date: "2026-11-19",
    amountTiyn: 11000,
    type: "expense",
    rawOperation: "Покупка",
    description: "Живая Вода",
    isPersonalLooking: false,
    ...overrides,
  };
}

describe("markDuplicates", () => {
  it("does not flag two identical rows within the same fresh statement (no prior data)", () => {
    const rows = [row(), row()];
    expect(markDuplicates(rows, [])).toEqual([false, false]);
  });

  it("flags rows as duplicates when the same statement is re-uploaded", () => {
    const rows = [row(), row()];
    const existing = [
      { date: "2026-11-19", amount: 11000, type: "expense" as const, description: "Живая Вода" },
      { date: "2026-11-19", amount: 11000, type: "expense" as const, description: "Живая Вода" },
    ];
    expect(markDuplicates(rows, existing)).toEqual([true, true]);
  });

  it("only flags as many rows as there are matching existing ones", () => {
    const rows = [row(), row(), row()];
    const existing = [
      { date: "2026-11-19", amount: 11000, type: "expense" as const, description: "Живая Вода" },
    ];
    expect(markDuplicates(rows, existing)).toEqual([true, false, false]);
  });

  it("never flags internal transfers", () => {
    const rows = [row({ type: "internal" })];
    const existing = [
      { date: "2026-11-19", amount: 11000, type: "expense" as const, description: "Живая Вода" },
    ];
    expect(markDuplicates(rows, existing)).toEqual([false]);
  });
});
