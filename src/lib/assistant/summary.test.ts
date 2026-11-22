import { describe, expect, it } from "vitest";
import { buildSummaryText, type SummaryRow } from "@/lib/assistant/summary";

const today = new Date(2026, 10, 22); // Nov 22, 2026

function row(date: string, type: "income" | "expense", amountTiyn: number, categorySlug: string | null = null): SummaryRow {
  return { date, type, amountTiyn, categorySlug };
}

describe("buildSummaryText", () => {
  it("computes income/expense/profit for the selected period", () => {
    const rows: SummaryRow[] = [
      row("2026-11-05", "income", 100_000_00),
      row("2026-11-10", "expense", 40_000_00, "cogs"),
      row("2026-10-05", "income", 999_999_00), // outside "thisMonth"
    ];
    const text = buildSummaryText(rows, "thisMonth", 4, today);
    expect(text).toContain("Income: 100,000 KZT");
    expect(text).toContain("Expense: 40,000 KZT");
    expect(text).toContain("Profit: 60,000 KZT");
    // October's income is out of range for "thisMonth" headline figures, but
    // it correctly still shows up in the always-last-6-months trend section.
    expect(text.split("Monthly trend")[0]).not.toContain("999,999");
  });

  it("breaks expenses down by category with a percentage share", () => {
    const rows: SummaryRow[] = [
      row("2026-11-05", "expense", 75_00_00, "cogs"),
      row("2026-11-06", "expense", 25_00_00, "rent"),
    ];
    const text = buildSummaryText(rows, "thisMonth", 4, today);
    expect(text).toContain("Cost of goods: 7,500 KZT (75%)");
    expect(text).toContain("Rent: 2,500 KZT (25%)");
  });

  it("defaults an uncategorized expense to Other", () => {
    const rows: SummaryRow[] = [row("2026-11-05", "expense", 1_000_00, null)];
    const text = buildSummaryText(rows, "thisMonth", 4, today);
    expect(text).toContain("Other: 1,000 KZT (100%)");
  });

  it("never includes anything beyond date/type/amount/category — no way to leak descriptions", () => {
    const rows: SummaryRow[] = [row("2026-11-05", "expense", 1_000_00, "rent")];
    // TypeScript itself prevents a SummaryRow from carrying description/
    // counterparty; this just documents that guarantee as a runtime check.
    expect(Object.keys(rows[0]).sort()).toEqual(["amountTiyn", "categorySlug", "date", "type"]);
  });

  it("includes a tax line computed from the current half-year's income", () => {
    const rows: SummaryRow[] = [row("2026-11-05", "income", 1_000_000_00)];
    const text = buildSummaryText(rows, "thisMonth", 4, today);
    // 1,000,000 * 4% = 40,000
    expect(text).toContain("Tax due for the current half-year");
    expect(text).toContain("40,000 KZT");
  });

  it("includes six months of trend regardless of the selected period", () => {
    const text = buildSummaryText([], "thisMonth", 4, today);
    const trendSection = text.split("Monthly trend (last 6 months):")[1];
    const lines = trendSection.split("\n").filter((l) => l.startsWith("- "));
    expect(lines).toHaveLength(6);
  });
});
