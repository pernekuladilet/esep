"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTenge } from "@/lib/format";
import { SYSTEM_CATEGORY_SLUGS } from "@/lib/categorize/slugs";
import { uploadAndParseStatement, confirmImport } from "@/lib/imports/actions";
import type { PreviewRow } from "@/lib/imports/types";

const ERROR_KEYS = ["no_file", "unsupported_file_type", "no_rows_found", "import_record_failed"];

export function ImportFlow() {
  const t = useTranslations("imports");
  const tCategories = useTranslations("categories");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function handleUpload(formData: FormData) {
    setErrorKey(null);
    startTransition(async () => {
      const result = await uploadAndParseStatement(formData);
      if (!result.ok) {
        setErrorKey(ERROR_KEYS.includes(result.error) ? result.error : "import_record_failed");
        return;
      }
      setImportId(result.importId);
      setRows(result.rows);
    });
  }

  function updateRow(tempId: string, patch: Partial<PreviewRow>) {
    setRows((prev) => prev?.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)) ?? prev);
  }

  function setAllIncluded(included: boolean) {
    setRows(
      (prev) => prev?.map((r) => (r.type === "internal" ? r : { ...r, included })) ?? prev,
    );
  }

  function handleConfirm() {
    if (!importId || !rows) return;
    startTransition(async () => {
      await confirmImport(
        importId,
        rows.map((r) => ({
          date: r.date,
          amountTiyn: r.amountTiyn,
          type: r.type as "income" | "expense",
          description: r.description,
          categorySlug: r.categorySlug,
          included: r.included,
        })),
      );
      router.push("/operations");
    });
  }

  if (!rows) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
        </CardHeader>
        <form action={handleUpload}>
          <CardContent className="flex flex-col gap-4">
            {errorKey && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t(`errors.${errorKey}` as Parameters<typeof t>[0])}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="file">{t("subtitle")}</Label>
              <Input id="file" name="file" type="file" accept=".pdf,.csv,.xlsx,.xls" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("uploading") : t("uploadButton")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{t("previewTitle")}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAllIncluded(true)}>
            {t("selectAll")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAllIncluded(false)}>
            {t("deselectAll")}
          </Button>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.tempId}>
            <Card>
              <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <Checkbox
                  checked={row.included}
                  disabled={row.type === "internal"}
                  onCheckedChange={(checked) =>
                    updateRow(row.tempId, { included: checked === true })
                  }
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{row.date}</span>
                    <span className="font-medium">{row.description}</span>
                    {row.type === "internal" && (
                      <Badge variant="outline">{t("internalBadge")}</Badge>
                    )}
                    {row.isDuplicate && <Badge variant="destructive">{t("duplicateBadge")}</Badge>}
                    {row.isPersonalLooking && row.type !== "internal" && (
                      <Badge variant="secondary">{t("personalBadge")}</Badge>
                    )}
                  </div>
                  <span
                    className={
                      row.type === "income" ? "text-sm font-medium text-brand" : "text-sm font-medium"
                    }
                  >
                    {row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}
                    {formatTenge(row.amountTiyn)}
                  </span>
                </div>
                {row.type !== "internal" && (
                  <select
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    value={row.categorySlug}
                    disabled={!row.included}
                    onChange={(e) => updateRow(row.tempId, { categorySlug: e.target.value })}
                  >
                    {SYSTEM_CATEGORY_SLUGS.map((slug) => (
                      <option key={slug} value={slug}>
                        {tCategories(slug)}
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/operations")}>
          {t("backToOperations")}
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isPending}>
          {isPending ? t("confirming") : t("confirmButton")}
        </Button>
      </div>
    </div>
  );
}
