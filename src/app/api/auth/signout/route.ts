import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler, not a Server Action — see src/app/api/auth/login/route.ts
// for why.
export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale") ?? "ru");

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url), { status: 303 });
}
