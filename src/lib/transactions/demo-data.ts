"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/business/current";
import { buildDemoRows } from "@/lib/transactions/demo-data-builder";

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
        source: "demo" as const,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const { error } = await supabase.from("transactions").insert(rows);
  if (error && process.env.NODE_ENV !== "production") {
    console.error("[transactions] seedDemoData failed:", error.message);
  }

  redirect({ href: "/dashboard", locale });
}

export async function deleteDemoData() {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("business_id", business.id)
    .eq("source", "demo");

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[transactions] deleteDemoData failed:", error.message);
  }

  redirect({ href: "/settings?demoDeleted=1", locale });
}
