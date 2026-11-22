import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getHalfYear,
  getPeriodRange,
  getDeadlines,
  calculateTax,
  daysUntil,
  isoLocal,
} from "@/lib/tax/calculate";
import type { SummaryPeriod } from "@/lib/assistant/constants";

export type SummaryRow = {
  date: string; // YYYY-MM-DD
  type: "income" | "expense";
  amountTiyn: number;
  categorySlug: string | null;
};

// Internal labels only — this text is model context, never rendered to the
// user. Claude is instructed separately to answer in the interface language,
// so these don't need to be localized themselves.
const CATEGORY_LABELS: Record<string, string> = {
  revenue: "Revenue",
  cogs: "Cost of goods",
  rent: "Rent",
  salary: "Payroll",
  utilities: "Utilities",
  taxes: "Taxes",
  advertising: "Advertising",
  other: "Other",
};

function tenge(amountTiyn: number): string {
  return `${Math.round(amountTiyn / 100).toLocaleString("en-US")} KZT`;
}

function monthBounds(year: number, month: number) {
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
}

function sumByType(rows: SummaryRow[], type: "income" | "expense"): number {
  return rows.filter((r) => r.type === type).reduce((acc, r) => acc + r.amountTiyn, 0);
}

function periodRange(periodOption: SummaryPeriod, today: Date): { start: Date; end: Date } {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (periodOption) {
    case "lastMonth": {
      const b = monthBounds(year, month - 1);
      return { start: b.start, end: b.end };
    }
    case "last3":
      return { start: monthBounds(year, month - 2).start, end: today };
    case "last6":
      return { start: monthBounds(year, month - 5).start, end: today };
    case "thisYear":
      return { start: new Date(year, 0, 1), end: today };
    default:
      return { start: monthBounds(year, month).start, end: today };
  }
}

/**
 * I/O wrapper — selects ONLY date/type/amount/category. Never description or
 * counterparty: those columns aren't even in the select list, so there is
 * nothing for a bug elsewhere to leak into the LLM prompt.
 */
export async function fetchSummaryRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  businessId: string,
  sinceIso: string,
): Promise<SummaryRow[]> {
  const { data } = await supabase
    .from("transactions")
    .select("date, type, amount, categories(slug)")
    .eq("business_id", businessId)
    .gte("date", sinceIso);

  return ((data ?? []) as unknown as { date: string; type: "income" | "expense"; amount: number; categories: { slug: string } | null }[]).map(
    (row) => ({
      date: row.date,
      type: row.type,
      amountTiyn: row.amount,
      categorySlug: row.categories?.slug ?? null,
    }),
  );
}

/** Pure: builds the compact context block handed to Claude. Testable without a DB. */
export function buildSummaryText(
  rows: SummaryRow[],
  periodOption: SummaryPeriod,
  taxRatePercent: number,
  today: Date = new Date(),
): string {
  const { start, end } = periodRange(periodOption, today);
  const startIso = isoLocal(start);
  const endIso = isoLocal(end);
  const periodRows = rows.filter((r) => r.date >= startIso && r.date <= endIso);

  const income = sumByType(periodRows, "income");
  const expense = sumByType(periodRows, "expense");
  const profit = income - expense;

  const categoryTotals = new Map<string, number>();
  for (const row of periodRows) {
    if (row.type !== "expense") continue;
    const slug = row.categorySlug ?? "other";
    categoryTotals.set(slug, (categoryTotals.get(slug) ?? 0) + row.amountTiyn);
  }
  const categoryLines = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, amount]) => {
      const share = expense > 0 ? Math.round((amount / expense) * 100) : 0;
      return `- ${CATEGORY_LABELS[slug] ?? slug}: ${tenge(amount)} (${share}%)`;
    });

  const trendLines: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const bounds = monthBounds(today.getFullYear(), today.getMonth() - i);
    const bIso = isoLocal(bounds.start);
    const eIso = isoLocal(bounds.end);
    const monthRows = rows.filter((r) => r.date >= bIso && r.date <= eIso);
    const mIncome = sumByType(monthRows, "income");
    const mExpense = sumByType(monthRows, "expense");
    const label = bounds.start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    trendLines.push(`- ${label}: income ${tenge(mIncome)}, expense ${tenge(mExpense)}, profit ${tenge(mIncome - mExpense)}`);
  }

  const half = getHalfYear(today);
  const { startIso: hStartIso, endIso: hEndIso } = getPeriodRange(half.year, half.half);
  const halfIncome = sumByType(
    rows.filter((r) => r.date >= hStartIso && r.date <= hEndIso),
    "income",
  );
  const taxDue = calculateTax(halfIncome, taxRatePercent);
  const { reportDate, payDate } = getDeadlines(half.year, half.half);

  return [
    `Business summary (period: ${startIso} to ${endIso}):`,
    `Income: ${tenge(income)}`,
    `Expense: ${tenge(expense)}`,
    `Profit: ${tenge(profit)}`,
    "",
    "Expenses by category:",
    ...(categoryLines.length > 0 ? categoryLines : ["- no expenses in this period"]),
    "",
    "Monthly trend (last 6 months):",
    ...trendLines,
    "",
    `Tax (simplified regime, rate ${taxRatePercent}%):`,
    `Tax due for the current half-year (${hStartIso} to ${hEndIso}): ${tenge(taxDue)}`,
    `File form 910.00 by ${isoLocal(reportDate)} (${daysUntil(reportDate, today)} days left)`,
    `Pay the tax by ${isoLocal(payDate)} (${daysUntil(payDate, today)} days left)`,
  ].join("\n");
}
