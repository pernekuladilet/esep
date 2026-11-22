import { requireBusiness } from "@/lib/business/current";
import { createReminder } from "@/lib/reminders/actions";
import { ReminderForm } from "@/components/reminders/reminder-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewReminderPage({ searchParams }: Props) {
  const { error } = await searchParams;
  await requireBusiness();

  return (
    <main className="mx-auto flex max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <ReminderForm action={createReminder} hasError={Boolean(error)} />
    </main>
  );
}
