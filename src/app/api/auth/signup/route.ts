import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapAuthError } from "@/lib/auth/helpers";

// Route Handler, not a Server Action — see src/app/api/auth/login/route.ts
// for why.
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "ru");

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/${locale}/onboarding`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/signup?error=${mapAuthError(error, "signUp")}`, request.url),
      { status: 303 },
    );
  }

  if (data.session) {
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/${locale}/signup?checkEmail=1`, request.url), { status: 303 });
}
