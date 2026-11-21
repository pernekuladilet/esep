"use server";

import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

const BUSINESS_TYPES = ["ip", "too"] as const;
const TAX_REGIMES = ["simplified", "patent", "retail_tax", "general"] as const;
const LANGUAGES = ["ru", "kk", "en"] as const;

export async function createBusiness(formData: FormData) {
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect({ href: "/login", locale });
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const taxRegime = String(formData.get("taxRegime") ?? "");
  const language = String(formData.get("language") ?? locale);

  if (
    !name ||
    !BUSINESS_TYPES.includes(type as (typeof BUSINESS_TYPES)[number]) ||
    !TAX_REGIMES.includes(taxRegime as (typeof TAX_REGIMES)[number])
  ) {
    redirect({ href: "/onboarding?error=1", locale });
  }

  const { error: businessError } = await supabase.from("businesses").insert({
    owner_id: userData.user!.id,
    name,
    type,
    tax_regime: taxRegime,
  });

  if (businessError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[business] createBusiness failed:", businessError.message);
    }
    redirect({ href: "/onboarding?error=1", locale });
  }

  if (LANGUAGES.includes(language as (typeof LANGUAGES)[number])) {
    await supabase
      .from("profiles")
      .update({ language })
      .eq("id", userData.user!.id);
  }

  redirect({ href: "/dashboard", locale: language });
}
