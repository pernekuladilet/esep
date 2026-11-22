import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureTaxReminders } from "@/lib/reminders/tax-reminders";
import { isoLocal } from "@/lib/tax/calculate";
import { sendReminderEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

type ReminderRow = {
  id: string;
  business_id: string;
  type: string;
  title: string | null;
  date: string;
  remind_days_before: number;
  last_sent_at: string | null;
  businesses: { owner_id: string; name: string } | null;
};

function isDue(reminder: ReminderRow, todayIso: string): boolean {
  if (reminder.last_sent_at && reminder.last_sent_at.slice(0, 10) === todayIso) return false;
  const remindFrom = new Date(reminder.date);
  remindFrom.setDate(remindFrom.getDate() - reminder.remind_days_before);
  return isoLocal(remindFrom) <= todayIso && todayIso <= reminder.date;
}

function subjectFor(reminder: ReminderRow): string {
  if (reminder.type === "tax") {
    return reminder.title === "pay" ? "Срок уплаты налога" : "Срок сдачи декларации";
  }
  if (reminder.type === "custom") return reminder.title ?? "Напоминание";
  if (reminder.type === "rent") return "Напоминание об аренде";
  return "Напоминание о зарплате";
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const todayIso = isoLocal(today);

  const { data: simplifiedBusinesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("tax_regime", "simplified");

  for (const business of simplifiedBusinesses ?? []) {
    await ensureTaxReminders(supabase, business.id as string);
  }

  const { data: reminders } = await supabase
    .from("reminders")
    .select("id, business_id, type, title, date, remind_days_before, last_sent_at, businesses(owner_id, name)")
    .gte("date", todayIso);

  let sent = 0;
  for (const reminder of (reminders ?? []) as unknown as ReminderRow[]) {
    if (!isDue(reminder, todayIso)) continue;
    const ownerId = reminder.businesses?.owner_id;
    if (!ownerId) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(ownerId);
    const email = userData?.user?.email;
    if (!email) continue;

    const didSend = await sendReminderEmail({
      to: email,
      subject: subjectFor(reminder),
      text: `${subjectFor(reminder)} — ${reminder.date}. Это автоматическое напоминание от Esep.`,
    });

    if (didSend) {
      await supabase.from("reminders").update({ last_sent_at: today.toISOString() }).eq("id", reminder.id);
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, checked: reminders?.length ?? 0, sent });
}
