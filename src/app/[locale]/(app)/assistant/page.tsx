import { getLocale } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { getDailyLimit } from "@/lib/assistant/limits";
import { getTodayUsage } from "@/lib/assistant/usage";
import type { Plan } from "@/lib/assistant/constants";
import { Chat } from "@/components/assistant/chat";

export default async function AssistantPage() {
  const locale = await getLocale();
  const { supabase, userId, business } = await requireBusiness();

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
  const plan = (profile?.plan ?? "free") as Plan;
  const limit = getDailyLimit(plan);
  const used = await getTodayUsage(supabase, business.id);

  return (
    <main className="mx-auto flex flex-1 flex-col items-center px-4 py-8 sm:px-6">
      <Chat locale={locale} initialUsed={used} limit={limit} />
    </main>
  );
}
