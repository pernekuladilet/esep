import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fetchSummaryRows, buildSummaryText } from "@/lib/assistant/summary";
import { getDailyLimit, isOverLimit } from "@/lib/assistant/limits";
import { getTodayUsage, incrementTodayUsage } from "@/lib/assistant/usage";
import { isoLocal } from "@/lib/tax/calculate";
import { SUMMARY_PERIOD_OPTIONS, type Plan, type SummaryPeriod } from "@/lib/assistant/constants";

export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const LOCALE_NAMES: Record<string, string> = {
  ru: "Russian",
  kk: "Kazakh",
  en: "English",
};

function monthsAgoIso(months: number, from = new Date()): string {
  return isoLocal(new Date(from.getFullYear(), from.getMonth() - months, 1));
}

// Not requireBusiness() on purpose — it calls next-intl's redirect(), which
// doesn't translate into an HTTP redirect from inside a Route Handler the
// way it does from a page. This returns a plain 401/404 instead.
async function requireBusinessForApi() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 401 as const };

  const { data: business } = await supabase
    .from("businesses")
    .select("id, tax_rate")
    .eq("owner_id", userData.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) return { error: 404 as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userData.user.id)
    .maybeSingle();

  return { supabase, userId: userData.user.id, business, plan: (profile?.plan ?? "free") as Plan };
}

export async function POST(request: Request) {
  const auth = await requireBusinessForApi();
  if ("error" in auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.error });
  }
  const { supabase, business, plan } = auth;

  const limit = getDailyLimit(plan);
  const used = await getTodayUsage(supabase, business.id);
  if (isOverLimit(used, limit)) {
    return NextResponse.json({ error: "limit_reached", limit, used }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const messages: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages.filter(
        (m: unknown): m is ChatMessage =>
          typeof m === "object" &&
          m !== null &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string",
      )
    : [];
  const periodOption: SummaryPeriod = SUMMARY_PERIOD_OPTIONS.includes(body?.periodOption)
    ? body.periodOption
    : "thisMonth";
  const locale = typeof body?.locale === "string" ? body.locale : "ru";

  if (messages.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }

  const rows = await fetchSummaryRows(supabase, business.id, monthsAgoIso(13));
  const summaryText = buildSummaryText(rows, periodOption, Number(business.tax_rate));

  const systemPrompt = [
    "You are a concise financial assistant inside Esep, a bookkeeping app for small",
    "businesses in Kazakhstan. You only know what is in the summary below — you have",
    "no access to individual transactions, descriptions, or names. Never invent numbers",
    "that aren't in the summary; if something isn't covered by it, say so plainly.",
    `Answer in ${LOCALE_NAMES[locale] ?? "Russian"}, briefly, referencing concrete figures`,
    "from the summary. This is a reference estimate, not professional financial or tax advice.",
    "",
    summaryText,
  ].join("\n");

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  // Guards every controller call: if the client disconnects mid-reply,
  // `cancel()` fires and the platform closes the controller on its own —
  // any later enqueue/close from the still-running Anthropic stream would
  // otherwise throw "Controller is already closed" as an unhandled
  // rejection, and (found via a real browser test that closed the tab
  // mid-stream) skip incrementTodayUsage entirely since the throw happened
  // before that line ran.
  let closed = false;
  let abortUpstream = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const anthropicStream = client.messages.stream({
        model: "claude-sonnet-5-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      abortUpstream = () => anthropicStream.abort();

      anthropicStream.on("text", (textDelta) => {
        if (closed) return;
        controller.enqueue(encoder.encode(textDelta));
      });

      anthropicStream.on("error", (error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[assistant] stream error:", error.message);
        }
      });

      anthropicStream
        .finalMessage()
        .then(() => incrementTodayUsage(supabase, business.id))
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("[assistant] finalMessage failed:", (error as Error).message);
          }
        })
        .finally(() => {
          if (closed) return;
          closed = true;
          controller.close();
        });
    },
    cancel() {
      // The client disconnected (tab closed, navigated away). Stop paying
      // for tokens nobody will read, and stop the completion handler above
      // from touching this controller again.
      closed = true;
      abortUpstream();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
