import { createClient } from "@/lib/supabase/server";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailTaken"
  | "weakPassword"
  | "invalidEmail"
  | "emailNotConfirmed"
  | "rateLimited"
  | "generic";

export function mapAuthError(error: { code?: string; message: string }, context: string): AuthErrorCode {
  // Always logged (not just in dev) — this is the only place the real
  // Supabase error text ends up anywhere, and in production that only
  // reaches us via Vercel's function logs. Gating it behind NODE_ENV meant
  // every "generic" fallback in production was completely unexplainable.
  console.error(`[auth] ${context} failed (${error.code ?? "no code"}):`, error.message);

  switch (error.code) {
    case "user_already_exists":
      return "emailTaken";
    case "invalid_credentials":
      return "invalidCredentials";
    case "weak_password":
      return "weakPassword";
    case "email_address_invalid":
    case "validation_failed":
      return "invalidEmail";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
  }

  if (error.message.includes("already registered")) return "emailTaken";
  if (error.message.includes("Invalid login credentials")) return "invalidCredentials";
  if (error.message.includes("Password should be at least")) return "weakPassword";
  if (error.message.includes("Email not confirmed")) return "emailNotConfirmed";
  return "generic";
}

export async function hasBusiness(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.from("businesses").select("id").limit(1);
  return (data?.length ?? 0) > 0;
}
