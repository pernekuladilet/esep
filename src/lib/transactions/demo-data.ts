"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/business/current";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

type DemoRow = {
  date: string;
  type: "income" | "expense";
  slug: string;
  amountTiyn: number;
  description: string;
};

/** ~60 plausible transactions for a coffee shop over the last 60 days. */
function buildDemoRows(): DemoRow[] {
  const rows: DemoRow[] = [];

  // Daily revenue, skipping some days to look real (~38 entries).
  for (let d = 59; d >= 0; d--) {
    if (Math.random() < 0.37) continue;
    const date = daysAgo(d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const amount = randomBetween(isWeekend ? 22000 : 14000, isWeekend ? 58000 : 42000);
    rows.push({
      date: isoDate(date),
      type: "income",
      slug: "revenue",
      amountTiyn: amount * 100,
      description: "Выручка за день",
    });
  }

  // Weekly restocking (~8 entries).
  for (let w = 0; w < 8; w++) {
    const date = daysAgo(w * 7 + randomBetween(0, 2));
    rows.push({
      date: isoDate(date),
      type: "expense",
      slug: "cogs",
      amountTiyn: randomBetween(20000, 60000) * 100,
      description: "Закуп кофе и молока",
    });
  }

  // Rent, utilities, taxes — monthly (2 of each over 60 days).
  for (const monthStart of [59, 29]) {
    rows.push({
      date: isoDate(daysAgo(monthStart)),
      type: "expense",
      slug: "rent",
      amountTiyn: randomBetween(145000, 155000) * 100,
      description: "Аренда помещения",
    });
    rows.push({
      date: isoDate(daysAgo(monthStart - 2)),
      type: "expense",
      slug: "utilities",
      amountTiyn: randomBetween(20000, 28000) * 100,
      description: "Коммунальные платежи",
    });
    rows.push({
      date: isoDate(daysAgo(monthStart - 5)),
      type: "expense",
      slug: "taxes",
      amountTiyn: randomBetween(30000, 40000) * 100,
      description: "Налоговый платёж",
    });
  }

  // Bi-weekly salary (~4 entries).
  for (let i = 0; i < 4; i++) {
    rows.push({
      date: isoDate(daysAgo(i * 15 + randomBetween(0, 2))),
      type: "expense",
      slug: "salary",
      amountTiyn: randomBetween(85000, 95000) * 100,
      description: "Зарплата персонала",
    });
  }

  // Occasional advertising and misc (~3 each).
  for (let i = 0; i < 3; i++) {
    rows.push({
      date: isoDate(daysAgo(randomBetween(0, 58))),
      type: "expense",
      slug: "advertising",
      amountTiyn: randomBetween(5000, 15000) * 100,
      description: "Реклама в Instagram",
    });
    rows.push({
      date: isoDate(daysAgo(randomBetween(0, 58))),
      type: "expense",
      slug: "other",
      amountTiyn: randomBetween(3000, 20000) * 100,
      description: "Прочие расходы",
    });
  }

  return rows;
}

export async function seedDemoData() {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (count && count > 0) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("is_system", true);

  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug as string, c.id]));

  const rows = buildDemoRows()
    .map((row) => {
      const categoryId = categoryIdBySlug.get(row.slug);
      if (!categoryId) return null;
      return {
        business_id: business.id,
        date: row.date,
        type: row.type,
        category_id: categoryId,
        amount: row.amountTiyn,
        description: row.description,
        source: "manual" as const,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const { error } = await supabase.from("transactions").insert(rows);
  if (error && process.env.NODE_ENV !== "production") {
    console.error("[transactions] seedDemoData failed:", error.message);
  }

  redirect({ href: "/dashboard", locale });
}
