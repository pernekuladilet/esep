"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTenge, formatTengeCompact } from "@/lib/format";
import { CATEGORY_COLORS } from "@/lib/category-colors";

// Recharts' Tooltip `formatter` prop type is awkward to satisfy exactly;
// cast our simpler formatter functions to it instead of fighting the generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = any;

export type DailyPoint = { day: string; income: number; expense: number };
export type CategoryTotal = { slug: string; amount: number };

export function DailyChart({ data }: { data: DailyPoint[] }) {
  const t = useTranslations("dashboard");

  // Recharts shrinks bars to fit whatever width it's given — on a narrow
  // card with ~30 days that makes them hairline-thin no matter what
  // barSize/maxBarSize say. Force a real minimum width per day instead and
  // let the chart scroll horizontally if the card is narrower than that.
  const minWidth = Math.max(360, data.length * 22);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={2}
            barCategoryGap="12%"
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(value: number) => formatTengeCompact(value)}
            />
            <Tooltip
              formatter={
                ((value: number, key: string) => [
                  formatTenge(value),
                  key === "income" ? t("income") : t("expense"),
                ]) as TooltipFormatter
              }
              labelFormatter={
                ((day: string) => `${t("dayLabel")} ${day}`) as TooltipFormatter
              }
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="income" fill="var(--brand)" radius={[3, 3, 0, 0]} maxBarSize={18} />
            <Bar
              dataKey="expense"
              fill="var(--destructive)"
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: CategoryTotal[] }) {
  const tCategories = useTranslations("categories");
  const total = data.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto shrink-0 sm:mx-0">
        <PieChart width={200} height={200} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="slug"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.slug} fill={CATEGORY_COLORS[entry.slug] ?? "#64748b"} />
            ))}
          </Pie>
          <Tooltip
            formatter={
              ((value: number, _key: string, item: { payload?: CategoryTotal }) => [
                formatTenge(value),
                item.payload
                  ? tCategories(item.payload.slug as Parameters<typeof tCategories>[0])
                  : "",
              ]) as TooltipFormatter
            }
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </div>

      <ul className="flex flex-1 flex-col gap-2 text-sm">
        {data.map((entry) => {
          const percent = total > 0 ? Math.round((entry.amount / total) * 100) : 0;
          return (
            <li key={entry.slug} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[entry.slug] ?? "#64748b" }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">
                {tCategories(entry.slug as Parameters<typeof tCategories>[0])}
              </span>
              <span className="text-muted-foreground">{formatTenge(entry.amount)}</span>
              <span className="w-10 text-right font-medium">{percent}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
