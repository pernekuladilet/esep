import { getTranslations } from "next-intl/server";
import { requireBusiness } from "@/lib/business/current";
import { ensureTaxReminders } from "@/lib/reminders/tax-reminders";
import { deleteReminder } from "@/lib/reminders/actions";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/transactions/delete-button";

type ReminderRow = {
  id: string;
  type: string;
  title: string | null;
  date: string;
  repeat: string | null;
  remind_days_before: number;
};

export default async function RemindersPage() {
  const t = await getTranslations("reminders");
  const { supabase, business } = await requireBusiness();

  if (business.tax_regime === "simplified") {
    await ensureTaxReminders(supabase, business.id);
  }

  const { data } = await supabase
    .from("reminders")
    .select("id, type, title, date, repeat, remind_days_before")
    .eq("business_id", business.id)
    .order("date", { ascending: true });

  const reminders = (data ?? []) as ReminderRow[];

  function label(reminder: ReminderRow): string {
    if (reminder.type === "tax") {
      return t(`tax.${reminder.title === "pay" ? "pay" : "report"}` as Parameters<typeof t>[0]);
    }
    if (reminder.type === "custom") return reminder.title || t("typeOptions.custom");
    return t(`typeOptions.${reminder.type}` as Parameters<typeof t>[0]);
  }

  function repeatLabel(repeat: string | null): string {
    return t(`repeatOptions.${repeat ?? "none"}` as Parameters<typeof t>[0]);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Button asChild size="sm">
          <Link href="/reminders/new">{t("addButton")}</Link>
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">{t("emptyTitle")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("table.repeat")}</TableHead>
                  <TableHead>{t("table.remindDaysBefore")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>{reminder.date}</TableCell>
                    <TableCell>{label(reminder)}</TableCell>
                    <TableCell>{repeatLabel(reminder.repeat)}</TableCell>
                    <TableCell>{reminder.remind_days_before}</TableCell>
                    <TableCell className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/reminders/${reminder.id}/edit`}>{t("editButton")}</Link>
                      </Button>
                      <DeleteButton
                        action={deleteReminder.bind(null, reminder.id)}
                        label={t("deleteButton")}
                        confirmText={t("deleteConfirm")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 sm:hidden">
            {reminders.map((reminder) => (
              <li key={reminder.id}>
                <Card>
                  <CardContent className="flex flex-col gap-1 py-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{label(reminder)}</span>
                      <span className="text-sm text-muted-foreground">{reminder.date}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {repeatLabel(reminder.repeat)} · {t("table.remindDaysBefore")}: {reminder.remind_days_before}
                    </span>
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/reminders/${reminder.id}/edit`}>{t("editButton")}</Link>
                      </Button>
                      <DeleteButton
                        action={deleteReminder.bind(null, reminder.id)}
                        label={t("deleteButton")}
                        confirmText={t("deleteConfirm")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
