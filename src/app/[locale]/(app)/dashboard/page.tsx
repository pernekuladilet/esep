import { getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { seedDemoData } from "@/lib/transactions/demo-data";
import { formatTenge } from "@/lib/format";
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

function monthBounds(offsetMonths: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  return { start, end };
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function DashboardPage() {
  const { supabase, business } = await requireBusiness();
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

  const current = monthBounds(0);
  const previous = monthBounds(-1);

  const { data } = await supabase
    .from("transactions")
    .select("date, type, amount, categories(slug)")
    .eq("business_id", business.id)
    .gte("date", iso(previous.start))
    .lte("date", iso(current.end));

  const rows = (data ?? []) as unknown as Row[];

  const currentRows = rows.filter((r) => r.date >= iso(current.start) && r.date <= iso(current.end));
  const previousRows = rows.filter(
    (r) => r.date >= iso(previous.start) && r.date <= iso(previous.end),
  );

  const sum = (list: Row[], type: "income" | "expense") =>
    list.filter((r) => r.type === type).reduce((acc, r) => acc + r.amount, 0);

  const currentIncome = sum(currentRows, "income");
  const currentExpense = sum(currentRows, "expense");
  const currentProfit = currentIncome - currentExpense;

  const previousIncome = sum(previousRows, "income");
  const previousExpense = sum(previousRows, "expense");
  const previousProfit = previousIncome - previousExpense;

  const today = new Date();
  const daysSoFar = Math.min(today.getDate(), current.end.getDate());
  const dailyMap = new Map<string, DailyPoint>();
  for (let d = 1; d <= daysSoFar; d++) {
    dailyMap.set(String(d), { day: String(d), income: 0, expense: 0 });
  }
  for (const row of currentRows) {
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

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("greeting", { name: business.name })}
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("income")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(currentIncome)}</p>
            <p className="text-xs text-muted-foreground">{changeLabel(incomeChange)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("expense")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatTenge(currentExpense)}</p>
            <p className="text-xs text-muted-foreground">{changeLabel(expenseChange)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("profit")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-brand">{formatTenge(currentProfit)}</p>
            <p className="text-xs text-muted-foreground">{changeLabel(profitChange)}</p>
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
            <ul className="flex flex-col gap-2">
              {topExpenses.map((item) => (
                <li key={item.slug} className="flex items-center justify-between text-sm">
                  <span>{tCategories(item.slug as Parameters<typeof tCategories>[0])}</span>
                  <span className="font-medium">{formatTenge(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
