"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireBusiness } from "@/lib/business/current";
import { REMINDER_TYPES, REMINDER_REPEATS, type ReminderType, type ReminderRepeat } from "@/lib/reminders/constants";

type ReminderInput = {
  type: ReminderType;
  title: string | null;
  date: string;
  repeat: ReminderRepeat;
  remindDaysBefore: number;
};

function parseInput(formData: FormData): ReminderInput | null {
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const repeat = String(formData.get("repeat") ?? "none");
  const remindDaysBefore = Number.parseInt(String(formData.get("remindDaysBefore") ?? ""), 10);

  if (
    !REMINDER_TYPES.includes(type as ReminderType) ||
    !date ||
    !REMINDER_REPEATS.includes(repeat as ReminderRepeat) ||
    !Number.isFinite(remindDaysBefore) ||
    remindDaysBefore < 0 ||
    (type === "custom" && !title)
  ) {
    return null;
  }

  return {
    type: type as ReminderType,
    title: type === "custom" ? title : null,
    date,
    repeat: repeat as ReminderRepeat,
    remindDaysBefore,
  };
}

export async function createReminder(formData: FormData) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const input = parseInput(formData);
  if (!input) {
    redirect({ href: "/reminders/new?error=1", locale });
    return;
  }

  const { error } = await supabase.from("reminders").insert({
    business_id: business.id,
    type: input.type,
    title: input.title,
    date: input.date,
    repeat: input.repeat,
    remind_days_before: input.remindDaysBefore,
  });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[reminders] createReminder failed:", error.message);
    }
    redirect({ href: "/reminders/new?error=1", locale });
    return;
  }

  redirect({ href: "/reminders", locale });
}

export async function updateReminder(id: string, formData: FormData) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  const input = parseInput(formData);
  if (!input) {
    redirect({ href: `/reminders/${id}/edit?error=1`, locale });
    return;
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      type: input.type,
      title: input.title,
      date: input.date,
      repeat: input.repeat,
      remind_days_before: input.remindDaysBefore,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[reminders] updateReminder failed:", error.message);
    }
    redirect({ href: `/reminders/${id}/edit?error=1`, locale });
    return;
  }

  redirect({ href: "/reminders", locale });
}

export async function deleteReminder(id: string) {
  const locale = await getLocale();
  const { supabase, business } = await requireBusiness();

  await supabase.from("reminders").delete().eq("id", id).eq("business_id", business.id);

  redirect({ href: "/reminders", locale });
}
