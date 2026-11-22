import type { SupabaseClient } from "@supabase/supabase-js";
import { isoLocal } from "@/lib/tax/calculate";

// No generated Database types yet (see src/lib/supabase/rls.integration.test.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export async function getTodayUsage(supabase: Client, businessId: string): Promise<number> {
  const { data } = await supabase
    .from("ai_chat_usage")
    .select("message_count")
    .eq("business_id", businessId)
    .eq("date", isoLocal(new Date()))
    .maybeSingle();

  return data?.message_count ?? 0;
}

/**
 * Only call after a chat reply actually completed — a failed Claude call
 * (bad key, network error) must not burn the user's daily quota.
 */
export async function incrementTodayUsage(supabase: Client, businessId: string): Promise<void> {
  const today = isoLocal(new Date());
  const current = await getTodayUsage(supabase, businessId);

  const { error } = await supabase
    .from("ai_chat_usage")
    .upsert(
      { business_id: businessId, date: today, message_count: current + 1 },
      { onConflict: "business_id,date" },
    );

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[assistant] incrementTodayUsage failed:", error.message);
  }
}
