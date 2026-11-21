"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";

async function siteOrigin() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

type AuthErrorCode = "invalidCredentials" | "emailTaken" | "weakPassword" | "generic";

function mapAuthError(message: string): AuthErrorCode {
  if (message.includes("already registered")) return "emailTaken";
  if (message.includes("Invalid login credentials")) return "invalidCredentials";
  if (message.includes("Password should be at least")) return "weakPassword";
  return "generic";
}

async function hasBusiness(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("businesses").select("id").limit(1);
  return (data?.length ?? 0) > 0;
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = await getLocale();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/${locale}/onboarding`,
    },
  });

  if (error) {
    redirect({ href: `/signup?error=${mapAuthError(error.message)}`, locale });
  }

  if (data.session) {
    redirect({ href: "/onboarding", locale });
  }

  redirect({ href: "/signup?checkEmail=1", locale });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const locale = await getLocale();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    redirect({
      href: `/login?error=${mapAuthError(error.message)}${nextParam}`,
      locale,
    });
  }

  if (next) {
    redirect({ href: next, locale });
  }

  redirect({
    href: (await hasBusiness(supabase)) ? "/dashboard" : "/onboarding",
    locale,
  });
}

export async function signOut() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/login", locale });
}
