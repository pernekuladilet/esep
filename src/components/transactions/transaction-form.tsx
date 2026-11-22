"use client";

import { useMemo, useState } from "react";
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
import type { TransactionType } from "@/lib/transactions/constants";

type Category = { id: string; slug: string; type: TransactionType };

type InitialValues = {
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: string;
  description: string;
  counterparty: string;
};

export function TransactionForm({
  categories,
  action,
  initialValues,
  hasError,
}: {
  categories: Category[];
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: InitialValues;
  hasError?: boolean;
}) {
  const t = useTranslations("operations");
  const tCategories = useTranslations("categories");

  const [type, setType] = useState<TransactionType>(initialValues?.type ?? "expense");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  const selectClassName =
    "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

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
            <Label htmlFor="date">{t("form.dateLabel")}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={initialValues?.date}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">{t("form.typeLabel")}</Label>
            <select
              id="type"
              name="type"
              className={selectClassName}
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="income">{t("typeOptions.income")}</option>
              <option value="expense">{t("typeOptions.expense")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">{t("form.categoryLabel")}</Label>
            <select
              id="categoryId"
              name="categoryId"
              className={selectClassName}
              defaultValue={initialValues?.categoryId}
              required
            >
              <option value="" disabled>
                —
              </option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {tCategories(category.slug as Parameters<typeof tCategories>[0])}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">{t("form.amountLabel")}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialValues?.amount}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t("form.descriptionPlaceholder")}
              defaultValue={initialValues?.description}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="counterparty">{t("form.counterpartyLabel")}</Label>
            <Input
              id="counterparty"
              name="counterparty"
              placeholder={t("form.counterpartyPlaceholder")}
              defaultValue={initialValues?.counterparty}
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
