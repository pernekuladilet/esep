import type { SupabaseClient } from "@supabase/supabase-js";
import { getHalfYear, getDeadlines, isoLocal, type Half } from "@/lib/tax/calculate";

export type NewTaxReminder = {
  type: "tax";
  // Machine key, not display text — "report" (сдать форму 910.00) or "pay"
  // (уплатить налог). Translated in the UI via reminders.tax.<title>, since
  // tax reminders are shared across locales and can't carry hardcoded text.
  title: "report" | "pay";
  date: string; // YYYY-MM-DD
  repeat: "semiannual";
  remind_days_before: number;
};

function previousHalf(year: number, half: Half): { year: number; half: Half } {
  return half === 1 ? { year: year - 1, half: 2 } : { year, half: 1 };
}

/**
 * Pure: given today's date and the set of tax-reminder dates+titles that
 * already exist for a business, returns the ones still missing. Looks at the
 * previous and current half-year periods (not just "today's" period) because
 * a period's deadlines fall AFTER it closes — e.g. in January the most
 * relevant deadline is often still the previous half's, not the new one's.
 */
export function computeMissingTaxReminders(
  today: Date,
  existingKeys: ReadonlySet<string>,
): NewTaxReminder[] {
  const current = getHalfYear(today);
  const previous = previousHalf(current.year, current.half);

  const candidates: NewTaxReminder[] = [];
  for (const { year, half } of [previous, current]) {
    const { reportDate, payDate } = getDeadlines(year, half);
    candidates.push(
      { type: "tax", title: "report", date: isoLocal(reportDate), repeat: "semiannual", remind_days_before: 7 },
      { type: "tax", title: "pay", date: isoLocal(payDate), repeat: "semiannual", remind_days_before: 7 },
    );
  }

  const todayIso = isoLocal(today);
  return candidates.filter(
    (c) => c.date >= todayIso && !existingKeys.has(`${c.date}|${c.title}`),
  );
}

// No generated Database types yet (see src/lib/supabase/rls.integration.test.ts),
// so this accepts a loosely-typed client — it's called with both the
// request-scoped client (RLS-respecting) and the service-role admin client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureTaxReminders(supabase: SupabaseClient<any>, businessId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("reminders")
    .select("date, title")
    .eq("business_id", businessId)
    .eq("type", "tax");

  const existingKeys = new Set((existing ?? []).map((r) => `${r.date}|${r.title ?? ""}`));
  const missing = computeMissingTaxReminders(new Date(), existingKeys);
  if (missing.length === 0) return;

  const { error } = await supabase.from("reminders").insert(
    missing.map((r) => ({
      business_id: businessId,
      type: r.type,
      title: r.title,
      date: r.date,
      repeat: r.repeat,
      remind_days_before: r.remind_days_before,
    })),
  );

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[reminders] ensureTaxReminders insert failed:", error.message);
  }
}
