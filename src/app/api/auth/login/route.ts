import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError, hasBusiness } from "@/lib/auth/helpers";

// A plain Route Handler on purpose, not a Server Action: Server Actions
// carry their own CSRF-style origin check and a per-deployment encryption
// key for the action reference, both of which broke in production behind
// Vercel's edge ("Missing `origin` header from a forwarded Server Actions
// request" / "Failed to find Server Action ... older or newer deployment").
// A plain POST route has neither problem, and /api is already excluded
// from src/proxy.ts's matcher, so it never goes through that middleware hop.
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const locale = String(formData.get("locale") ?? "ru");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const nextParam = next ? `&next=${encodeURIComponent(next)}` : "";
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${mapAuthError(error, "signIn")}${nextParam}`, request.url),
      { status: 303 },
    );
  }

  if (next) {
    return NextResponse.redirect(new URL(`/${locale}${next}`, request.url), { status: 303 });
  }

  const dest = (await hasBusiness(supabase)) ? "dashboard" : "onboarding";
  return NextResponse.redirect(new URL(`/${locale}/${dest}`, request.url), { status: 303 });
}
