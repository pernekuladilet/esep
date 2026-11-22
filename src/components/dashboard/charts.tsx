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
import { formatTenge } from "@/lib/format";

const CATEGORY_COLORS: Record<string, string> = {
  revenue: "#0f9b8e",
  cogs: "#f59e0b",
  rent: "#8b5cf6",
  salary: "#3b82f6",
  utilities: "#06b6d4",
  taxes: "#ef4444",
  advertising: "#ec4899",
  other: "#64748b",
};

export type DailyPoint = { day: string; income: number; expense: number };
export type CategoryTotal = { slug: string; amount: number };

// Recharts' Tooltip `formatter` prop type is awkward to satisfy exactly;
// cast our simpler formatter functions to it instead of fighting the generics.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = any;

export function DailyChart({ data }: { data: DailyPoint[] }) {
  const t = useTranslations("dashboard");

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={
            ((value: number, key: string) => [
              formatTenge(value),
              key === "income" ? t("income") : t("expense"),
            ]) as TooltipFormatter
          }
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="income" fill="var(--brand)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({ data }: { data: CategoryTotal[] }) {
  const tCategories = useTranslations("categories");

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="slug"
          innerRadius={60}
          outerRadius={95}
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
    </ResponsiveContainer>
  );
}

export { CATEGORY_COLORS };
