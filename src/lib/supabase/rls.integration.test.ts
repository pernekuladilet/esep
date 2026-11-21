// Integration test against a REAL Supabase project (the one in `.env.local`),
// not a mock. It proves that `transactions` RLS policies actually isolate data
// between two different users.
//
// Skipped by default (and safe to leave skipped) because it needs the service
// role key to create/delete confirmed test users without sending real emails.
// To run it: set SUPABASE_SERVICE_ROLE_KEY in your shell (not committed) and
// run `npm test` — it creates two throwaway users/businesses/transactions and
// deletes them again in `afterAll`.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(SUPABASE_URL && ANON_KEY && SERVICE_ROLE_KEY);

// No generated Database types yet, so opt into a loosely-typed client here.
function anonClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe.skipIf(!canRun)("RLS: transactions are isolated between users", () => {
  let admin: ReturnType<typeof anonClient>;

  const password = "Rls-test-password-123!";
  const emailA = `rls-test-a-${crypto.randomUUID()}@example.com`;
  const emailB = `rls-test-b-${crypto.randomUUID()}@example.com`;

  let userAId = "";
  let userBId = "";
  let businessAId = "";
  let businessBId = "";

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin = createClient<any>(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userA, error: userAError } = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });
    if (userAError || !userA.user) throw userAError ?? new Error("Failed to create user A");
    userAId = userA.user.id;

    const { data: userB, error: userBError } = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });
    if (userBError || !userB.user) throw userBError ?? new Error("Failed to create user B");
    userBId = userB.user.id;

    const { data: businessA, error: businessAError } = await admin
      .from("businesses")
      .insert({ owner_id: userAId, name: "RLS test A", type: "ip", tax_regime: "simplified" })
      .select("id")
      .single();
    if (businessAError) throw businessAError;
    businessAId = businessA.id;

    const { data: businessB, error: businessBError } = await admin
      .from("businesses")
      .insert({ owner_id: userBId, name: "RLS test B", type: "ip", tax_regime: "simplified" })
      .select("id")
      .single();
    if (businessBError) throw businessBError;
    businessBId = businessB.id;

    const { error: txAError } = await admin.from("transactions").insert({
      business_id: businessAId,
      date: "2026-01-01",
      amount: 1000,
      type: "income",
      source: "manual",
      description: "user A's transaction",
    });
    if (txAError) throw txAError;

    const { error: txBError } = await admin.from("transactions").insert({
      business_id: businessBId,
      date: "2026-01-01",
      amount: 2000,
      type: "income",
      source: "manual",
      description: "user B's transaction",
    });
    if (txBError) throw txBError;
  });

  afterAll(async () => {
    // Deleting the auth users cascades to their businesses and transactions.
    if (userAId) await admin.auth.admin.deleteUser(userAId);
    if (userBId) await admin.auth.admin.deleteUser(userBId);
  });

  it("only returns the signed-in user's own transactions", async () => {
    const clientA = anonClient();
    const { error: signInAError } = await clientA.auth.signInWithPassword({
      email: emailA,
      password,
    });
    expect(signInAError).toBeNull();

    const { data: visibleToA, error: selectAError } = await clientA
      .from("transactions")
      .select("description, business_id");
    expect(selectAError).toBeNull();
    expect(visibleToA).toHaveLength(1);
    expect(visibleToA?.[0]?.business_id).toBe(businessAId);

    const clientB = anonClient();
    const { error: signInBError } = await clientB.auth.signInWithPassword({
      email: emailB,
      password,
    });
    expect(signInBError).toBeNull();

    const { data: visibleToB, error: selectBError } = await clientB
      .from("transactions")
      .select("description, business_id");
    expect(selectBError).toBeNull();
    expect(visibleToB).toHaveLength(1);
    expect(visibleToB?.[0]?.business_id).toBe(businessBId);
  });
});
