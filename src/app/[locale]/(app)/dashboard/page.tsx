import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireBusiness } from "@/lib/business/current";
import { seedDemoData } from "@/lib/transactions/demo-data";
import { formatTenge } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DailyChart,
  CategoryPieChart,
  type DailyPoint,
  type CategoryTotal,
} from "@/components/dashboard/charts";

type Row = {
  date: string;
  type: "income" | "expense";
  amount: number;
  categories: { slug: string } | null;
};

type Metric = "income" | "expense" | "profit";

function monthBounds(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** income/profit up and expense down are "good" (green); the reverse is "bad" (red). */
function changeColorClass(metric: Metric, change: number | null) {
  if (change === null || change === 0) return "text-muted-foreground";
  const isGood = metric === "expense" ? change < 0 : change > 0;
  return isGood ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
}

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { month: monthParam } = await searchParams;
  const { supabase, business } = await requireBusiness();
  const locale = await getLocale();
  const t = await getTranslations("dashboard");
  const tCategories = await getTranslations("categories");

  const { count: totalCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const isEmpty = (totalCount ?? 0) === 0;

  if (isEmpty) {
    return (
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("greeting", { name: business.name })}
        </h1>
        <Card className="w-full">
          <CardContent className="flex flex-col items-start gap-3 py-6">
            <p className="text-muted-foreground">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
            <form action={seedDemoData}>
              <Button type="submit">{t("demoButton")}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const today = new Date();
  const realCurrent = { year: today.getFullYear(), month: today.getMonth() };

  let viewed = realCurrent;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    const parsed = { year: y, month: m - 1 };
    // Never allow navigating past the real current month.
    viewed =
      parsed.year > realCurrent.year ||
      (parsed.year === realCurrent.year && parsed.month > realCurrent.month)
        ? realCurrent
        : parsed;
  }

  const isViewingRealCurrentMonth =
    viewed.year === realCurrent.year && viewed.month === realCurrent.month;

  const current = monthBounds(viewed.year, viewed.month);
  const previous = monthBounds(viewed.year, viewed.month - 1);

  // "Same period" comparison: for the ongoing month, only count days elapsed
  // so far; for a fully past month, that's the whole month either way.
  const periodDays = isViewingRealCurrentMonth
    ? today.getDate()
    : current.end.getDate();
  const currentPeriodEnd = new Date(viewed.year, viewed.month, periodDays);
  const previousPeriodEnd = new Date(
    viewed.year,
    viewed.month - 1,
    Math.min(periodDays, previous.end.getDate()),
  );

  const { data } = await supabase
    .from("transactions")
    .select("date, type, amount, categories(slug)")
    .eq("business_id", business.id)
    .gte("date", iso(previous.start))
    .lte("date", iso(current.end));

  const rows = (data ?? []) as unknown as Row[];

  const currentRows = rows.filter(
    (r) => r.date >= iso(current.start) && r.date <= iso(currentPeriodEnd),
  );
  const previousRows = rows.filter(
    (r) => r.date >= iso(previous.start) && r.date <= iso(previousPeriodEnd),
  );

  const sum = (list: Row[], type: "income" | "expense") =>
    list.filter((r) => r.type === type).reduce((acc, r) => acc + r.amount, 0);

  const currentIncome = sum(currentRows, "income");
  const currentExpense = sum(currentRows, "expense");
  const currentProfit = currentIncome - currentExpense;

  const previousIncome = sum(previousRows, "income");
  const previousExpense = sum(previousRows, "expense");
  const previousProfit = previousIncome - previousExpense;

  // Daily series covers every day of the viewed month (not just elapsed days),
  // so the chart's x-axis is stable regardless of which month is selected.
  const daysInMonth = current.end.getDate();
  const dailyMap = new Map<string, DailyPoint>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(String(d), { day: String(d), income: 0, expense: 0 });
  }
  for (const row of rows) {
    if (row.date < iso(current.start) || row.date > iso(current.end)) continue;
    const day = String(Number(row.date.slice(8, 10)));
    const point = dailyMap.get(day);
    if (!point) continue;
    if (row.type === "income") point.income += row.amount;
    else point.expense += row.amount;
  }
  const dailySeries = Array.from(dailyMap.values());

  const categoryTotals = new Map<string, number>();
  for (const row of currentRows) {
    if (row.type !== "expense") continue;
    const slug = row.categories?.slug ?? "other";
    categoryTotals.set(slug, (categoryTotals.get(slug) ?? 0) + row.amount);
  }
  const categoryData: CategoryTotal[] = Array.from(categoryTotals, ([slug, amount]) => ({
    slug,
    amount,
  })).sort((a, b) => b.amount - a.amount);
  const topExpenses = categoryData.slice(0, 5);

  const incomeChange = percentChange(currentIncome, previousIncome);
  const expenseChange = percentChange(currentExpense, previousExpense);
  const profitChange = percentChange(currentProfit, previousProfit);

  function changeLabel(change: number | null) {
    if (change === null) return "";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}% ${t("vsLastMonth")}`;
  }

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(current.start);

  const prevMonthParam = `${previous.start.getFullYear()}-${String(previous.start.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthDate = new Date(viewed.year, viewed.month + 1, 1);
  const nextMonthParam = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("greeting", { name: business.name })}
      </h1>

      <div className="flex items-center justify-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={{ pathname: "/dashboard", query: { month: prevMonthParam } }}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <span className="min-w-36 text-center text-sm font-medium capitalize">
          {monthLabel}
        </span>
        {isViewingRealCurrentMonth ? (
          <Button variant="ghost" size="icon-sm" disabled>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={{ pathname: "/dashboard", query: { month: nextMonthParam } }}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("income")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(currentIncome)}</p>
            <p className={`text-xs ${changeColorClass("income", incomeChange)}`}>
              {changeLabel(incomeChange)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("expense")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(currentExpense)}</p>
            <p className={`text-xs ${changeColorClass("expense", expenseChange)}`}>
              {changeLabel(expenseChange)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("profit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-brand">{formatTenge(currentProfit)}</p>
            <p className={`text-xs ${changeColorClass("profit", profitChange)}`}>
              {changeLabel(profitChange)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dailyChartTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyChart data={dailySeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("categoryChartTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <CategoryPieChart data={categoryData} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("topExpensesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {topExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noExpenses")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topExpenses.map((item) => {
                const share =
                  currentExpense > 0 ? Math.round((item.amount / currentExpense) * 100) : 0;
                return (
                  <li key={item.slug} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[item.slug] ?? "#64748b" }}
                          aria-hidden="true"
                        />
                        {tCategories(item.slug as Parameters<typeof tCategories>[0])}
                      </span>
                      <span className="font-medium">
                        {formatTenge(item.amount)}{" "}
                        <span className="text-muted-foreground">({share}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${share}%`,
                          backgroundColor: CATEGORY_COLORS[item.slug] ?? "#64748b",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
