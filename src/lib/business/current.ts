import { cache } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export type Business = {
  id: string;
  name: string;
  type: string;
  tax_regime: string;
  tax_rate: number;
};

/**
 * Gates every (app) page behind "signed in" + "has a business". Wrapped in
 * `cache()` so the layout and a page can both call it without doubling the
 * Supabase round trip within the same request.
 */
export const requireBusiness = cache(async () => {
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect({ href: "/login", locale });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, tax_regime, tax_rate")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) {
    redirect({ href: "/onboarding", locale });
  }

  return { supabase, userId: userData.user!.id, business: business as Business };
});
