"use server";

import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/business/current";
import { SIMPLIFIED_RATE_OPTIONS, SIMPLIFIED_DEFAULT_RATE_PERCENT } from "@/lib/tax/config";
import { ensureTaxReminders } from "@/lib/reminders/tax-reminders";

const BUSINESS_TYPES = ["ip", "too"] as const;
const TAX_REGIMES = ["simplified", "patent", "retail_tax", "general"] as const;
const LANGUAGES = ["ru", "kk", "en"] as const;

function parseTaxRate(formData: FormData): number {
  const raw = Number(formData.get("taxRate"));
  return (SIMPLIFIED_RATE_OPTIONS as readonly number[]).includes(raw)
    ? raw
    : SIMPLIFIED_DEFAULT_RATE_PERCENT;
}

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
  const taxRate = parseTaxRate(formData);
  const language = String(formData.get("language") ?? locale);

  if (
    !name ||
    !BUSINESS_TYPES.includes(type as (typeof BUSINESS_TYPES)[number]) ||
    !TAX_REGIMES.includes(taxRegime as (typeof TAX_REGIMES)[number])
  ) {
    redirect({ href: "/onboarding?error=1", locale });
  }

  const { data: newBusiness, error: businessError } = await supabase
    .from("businesses")
    .insert({
      owner_id: userData.user!.id,
      name,
      type,
      tax_regime: taxRegime,
      tax_rate: taxRate,
    })
    .select("id")
    .single();

  if (businessError || !newBusiness) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[business] createBusiness failed:", businessError?.message);
    }
    redirect({ href: "/onboarding?error=1", locale });
  }

  if (newBusiness && taxRegime === "simplified") {
    await ensureTaxReminders(supabase, newBusiness.id as string);
  }

  if (LANGUAGES.includes(language as (typeof LANGUAGES)[number])) {
    await supabase
      .from("profiles")
      .update({ language })
      .eq("id", userData.user!.id);
  }

  redirect({ href: "/dashboard", locale: language });
}

export async function updateBusiness(formData: FormData) {
  const { supabase, userId, business } = await requireBusiness();
  const locale = await getLocale();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const taxRegime = String(formData.get("taxRegime") ?? "");
  const taxRate = parseTaxRate(formData);
  const language = String(formData.get("language") ?? locale);

  if (
    !name ||
    !BUSINESS_TYPES.includes(type as (typeof BUSINESS_TYPES)[number]) ||
    !TAX_REGIMES.includes(taxRegime as (typeof TAX_REGIMES)[number])
  ) {
    redirect({ href: "/settings?error=1", locale });
  }

  const { error: businessError } = await supabase
    .from("businesses")
    .update({ name, type, tax_regime: taxRegime, tax_rate: taxRate })
    .eq("id", business.id);

  if (businessError && process.env.NODE_ENV !== "production") {
    console.error("[business] updateBusiness failed:", businessError.message);
  }

  if (taxRegime === "simplified") {
    await ensureTaxReminders(supabase, business.id);
  }

  const nextLocale = LANGUAGES.includes(language as (typeof LANGUAGES)[number])
    ? language
    : locale;

  await supabase.from("profiles").update({ language: nextLocale }).eq("id", userId);

  redirect({ href: "/settings?saved=1", locale: nextLocale });
}
