import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for contexts with no user session (cron jobs) that
 * need to read/write across every business, bypassing RLS. Never import this
 * into anything reachable from a user request — only cron routes.
 */
export function createAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
