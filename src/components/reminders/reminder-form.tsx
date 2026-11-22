"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { REMINDER_TYPES, REMINDER_REPEATS, type ReminderType } from "@/lib/reminders/constants";

type InitialValues = {
  type: ReminderType;
  title: string;
  date: string;
  repeat: string;
  remindDaysBefore: string;
};

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function ReminderForm({
  action,
  initialValues,
  hasError,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: InitialValues;
  hasError?: boolean;
}) {
  const t = useTranslations("reminders");
  const [type, setType] = useState<ReminderType>(initialValues?.type ?? "custom");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          {initialValues ? t("form.editTitle") : t("form.newTitle")}
        </CardTitle>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {hasError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t("form.error")}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">{t("form.typeLabel")}</Label>
            <select
              id="type"
              name="type"
              className={selectClassName}
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
            >
              {REMINDER_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`typeOptions.${value}`)}
                </option>
              ))}
            </select>
          </div>

          {type === "custom" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">{t("form.titleLabel")}</Label>
              <Input
                id="title"
                name="title"
                placeholder={t("form.titlePlaceholder")}
                defaultValue={initialValues?.title}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">{t("form.dateLabel")}</Label>
            <Input id="date" name="date" type="date" defaultValue={initialValues?.date} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repeat">{t("form.repeatLabel")}</Label>
            <select
              id="repeat"
              name="repeat"
              className={selectClassName}
              defaultValue={initialValues?.repeat ?? "none"}
            >
              {REMINDER_REPEATS.map((value) => (
                <option key={value} value={value}>
                  {t(`repeatOptions.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remindDaysBefore">{t("form.remindDaysBeforeLabel")}</Label>
            <Input
              id="remindDaysBefore"
              name="remindDaysBefore"
              type="number"
              min="0"
              step="1"
              defaultValue={initialValues?.remindDaysBefore ?? "7"}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            {t("form.submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
