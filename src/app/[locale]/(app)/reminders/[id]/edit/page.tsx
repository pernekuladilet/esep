import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/business/current";
import { updateReminder } from "@/lib/reminders/actions";
import { ReminderForm } from "@/components/reminders/reminder-form";
import type { ReminderType } from "@/lib/reminders/constants";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditReminderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, business } = await requireBusiness();

  const { data: reminder } = await supabase
    .from("reminders")
    .select("id, type, title, date, repeat, remind_days_before")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!reminder) {
    notFound();
  }

  const action = updateReminder.bind(null, id);

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <ReminderForm
        action={action}
        hasError={Boolean(error)}
        initialValues={{
          type: reminder.type as ReminderType,
          title: reminder.title ?? "",
          date: reminder.date,
          repeat: reminder.repeat ?? "none",
          remindDaysBefore: String(reminder.remind_days_before),
        }}
      />
    </main>
  );
}
