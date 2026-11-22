"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
import { uploadAndParseStatement, confirmImport } from "@/lib/imports/actions";
import { ImportPreview } from "@/components/imports/import-preview";
import type { PreviewRow, CategorizationSummary } from "@/lib/imports/types";

const ERROR_KEYS = [
  "no_file",
  "unsupported_file_type",
  "parse_failed",
  "no_rows_found",
  "import_record_failed",
];

export function ImportFlow() {
  const t = useTranslations("imports");
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [importId, setImportId] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [summary, setSummary] = useState<CategorizationSummary | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    // Checked client-side first so "no file" never gets confused with a
    // format/parse error from the server, and so a plain-text input issue
    // in some browsers (Edge included) can't skip validation silently.
    if (!(file instanceof File) || file.size === 0) {
      setErrorKey("no_file");
      return;
    }

    setErrorKey(null);
    startTransition(async () => {
      const result = await uploadAndParseStatement(formData);
      if (!result.ok) {
        setErrorKey(ERROR_KEYS.includes(result.error) ? result.error : "import_record_failed");
        return;
      }
      setImportId(result.importId);
      setRows(result.rows);
      setSummary(result.summary);
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

  function bulkCategory(tempIds: string[], categorySlug: string) {
    const ids = new Set(tempIds);
    setRows(
      (prev) => prev?.map((r) => (ids.has(r.tempId) ? { ...r, categorySlug } : r)) ?? prev,
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
        <form onSubmit={handleUpload}>
          <CardContent className="flex flex-col gap-4">
            {errorKey && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {t(`errors.${errorKey}` as Parameters<typeof t>[0])}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="file">{t("subtitle")}</Label>
              {/* No `required` — native validation text varies by browser
                  (Edge included) and would bypass our own "Выберите файл". */}
              <Input id="file" name="file" type="file" accept=".pdf,.csv,.xlsx,.xls" />
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
    <ImportPreview
      rows={rows}
      summary={summary ?? { ruleCount: 0, aiCount: 0, otherCount: 0 }}
      isPending={isPending}
      onUpdateRow={updateRow}
      onBulkCategory={bulkCategory}
      onSetAllIncluded={setAllIncluded}
      onConfirm={handleConfirm}
      onBack={() => router.push("/operations")}
    />
  );
}
