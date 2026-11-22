"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTenge } from "@/lib/format";
import { SYSTEM_CATEGORY_SLUGS } from "@/lib/categorize/slugs";
import type { PreviewRow, CategorizationSummary } from "@/lib/imports/types";

type Filter = "all" | "toImport" | "personal" | "duplicates" | "other";

// Shared between the sticky header row and every data row so columns line
// up exactly; minmax(0, 1fr) on the description column (instead of 1fr) is
// what lets long text actually truncate instead of forcing the row wider
// than the viewport.
const GRID_COLS = "grid grid-cols-[1.5rem_minmax(0,1fr)_6.5rem_11rem] items-center gap-2";

function formatDateLabel(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function groupByDate(rows: PreviewRow[]): [string, PreviewRow[]][] {
  const groups = new Map<string, PreviewRow[]>();
  for (const row of rows) {
    const group = groups.get(row.date);
    if (group) group.push(row);
    else groups.set(row.date, [row]);
  }
  return [...groups.entries()];
}

type Props = {
  rows: PreviewRow[];
  summary: CategorizationSummary;
  isPending: boolean;
  onUpdateRow: (tempId: string, patch: Partial<PreviewRow>) => void;
  onBulkCategory: (tempIds: string[], categorySlug: string) => void;
  onSetAllIncluded: (included: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
};

export function ImportPreview({
  rows,
  summary,
  isPending,
  onUpdateRow,
  onBulkCategory,
  onSetAllIncluded,
  onConfirm,
  onBack,
}: Props) {
  const t = useTranslations("imports");
  const tCategories = useTranslations("categories");
  const tOperations = useTranslations("operations");
  const locale = useLocale();

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");

  const counts = useMemo(() => {
    let personal = 0;
    let duplicates = 0;
    let internal = 0;
    let other = 0;
    let toImport = 0;
    for (const row of rows) {
      if (row.type === "internal") internal += 1;
      if (row.isPersonalLooking && row.type !== "internal") personal += 1;
      if (row.isDuplicate) duplicates += 1;
      if (row.categorySlug === "other" && row.type !== "internal") other += 1;
      if (row.included) toImport += 1;
    }
    return { personal, duplicates, internal, other, toImport };
  }, [rows]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const row of rows) {
      if (!row.included) continue;
      if (row.type === "income") income += row.amountTiyn;
      else if (row.type === "expense") expense += row.amountTiyn;
    }
    return { income, expense };
  }, [rows]);

  const filteredRows = useMemo(() => {
    switch (filter) {
      case "toImport":
        return rows.filter((r) => r.included);
      case "personal":
        return rows.filter((r) => r.isPersonalLooking && r.type !== "internal");
      case "duplicates":
        return rows.filter((r) => r.isDuplicate);
      case "other":
        return rows.filter((r) => r.categorySlug === "other" && r.type !== "internal");
      default:
        return rows;
    }
  }, [rows, filter]);

  const groups = useMemo(() => groupByDate(filteredRows), [filteredRows]);

  function toggleSelected(tempId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setBulkCategory("");
  }

  function applyBulkCategory() {
    if (!bulkCategory || selected.size === 0) return;
    onBulkCategory([...selected], bulkCategory);
    clearSelection();
  }

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t("filters.all"), count: rows.length },
    { key: "toImport", label: t("filters.toImport"), count: counts.toImport },
    { key: "personal", label: t("filters.personal"), count: counts.personal },
    { key: "duplicates", label: t("filters.duplicates"), count: counts.duplicates },
    { key: "other", label: t("filters.other"), count: counts.other },
  ];

  function renderBadges(row: PreviewRow) {
    return (
      <>
        {row.type === "internal" && <Badge variant="outline">{t("internalBadge")}</Badge>}
        {row.isDuplicate && <Badge variant="destructive">{t("duplicateBadge")}</Badge>}
        {row.isPersonalLooking && row.type !== "internal" && (
          <Badge variant="secondary">{t("personalBadge")}</Badge>
        )}
      </>
    );
  }

  function renderAmount(row: PreviewRow) {
    return (
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          row.type === "income" && "text-brand",
        )}
      >
        {row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}
        {formatTenge(row.amountTiyn)}
      </span>
    );
  }

  function renderCategoryControl(row: PreviewRow) {
    if (row.type === "internal") return null;
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <select
          className="h-8 min-w-0 max-w-[8rem] flex-1 rounded-lg border border-input bg-transparent px-2 text-sm sm:max-w-[9rem]"
          value={row.categorySlug}
          disabled={!row.included}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateRow(row.tempId, { categorySlug: e.target.value })}
        >
          {SYSTEM_CATEGORY_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {tCategories(slug)}
            </option>
          ))}
        </select>
        {row.categorySource && (
          <Badge variant="ghost" className="shrink-0 font-semibold tracking-wide text-muted-foreground">
            {t(`source.${row.categorySource}`)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 max-w-4xl flex-col gap-3 pb-24">
      {/* Sticky summary + filters + table header, all pinned together */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b bg-background/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{t("previewTitle")}</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onSetAllIncluded(true)}>
              {t("selectAll")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onSetAllIncluded(false)}>
              {t("deselectAll")}
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">
            {t("summary.selected", { selected: counts.toImport, total: rows.length })}
          </span>
          <span className="text-brand">
            {t("summary.income")}: +{formatTenge(totals.income)}
          </span>
          <span>
            {t("summary.expense")}: {"−"}
            {formatTenge(totals.expense)}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {t("summary.personal")}: {counts.personal}
          </span>
          <span>
            {t("summary.duplicates")}: {counts.duplicates}
          </span>
          <span>
            {t("summary.internal")}: {counts.internal}
          </span>
          <span>
            {t("summary.other")}: {counts.other}
          </span>
          <span>
            {t("summary.categorization", {
              rules: summary.ruleCount,
              ai: summary.aiCount,
              other: summary.otherCount,
            })}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === tab.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <span>{t("bulk.selectedCount", { count: selected.size })}</span>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger size="sm">
                <SelectValue placeholder={t("bulk.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_CATEGORY_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {tCategories(slug)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" disabled={!bulkCategory} onClick={applyBulkCategory}>
              {t("bulk.apply")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
              {t("bulk.cancel")}
            </Button>
          </div>
        )}

        {/* Column header, desktop only — shown once, not per day group */}
        <div className={cn(GRID_COLS, "hidden px-1 text-xs font-medium text-muted-foreground sm:grid")}>
          <span />
          <span>{tOperations("table.description")}</span>
          <span className="text-right">{tOperations("table.amount")}</span>
          <span>{tOperations("table.category")}</span>
        </div>
      </div>

      {groups.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("filters.noRows")}</p>
      )}

      {/* Desktop rows, grouped by day */}
      <div className="hidden min-w-0 sm:flex sm:flex-col sm:gap-4">
        {groups.map(([date, dateRows]) => (
          <div key={date} className="flex min-w-0 flex-col gap-1">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">
              {formatDateLabel(date, locale)}
            </h2>
            {dateRows.map((row) => (
              <div
                key={row.tempId}
                onClick={() => row.type !== "internal" && toggleSelected(row.tempId)}
                className={cn(
                  GRID_COLS,
                  "rounded-lg px-1 py-1.5",
                  row.type !== "internal" && "cursor-pointer hover:bg-muted/50",
                  selected.has(row.tempId) && "bg-accent",
                )}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={row.included}
                    disabled={row.type === "internal"}
                    onCheckedChange={(checked) =>
                      onUpdateRow(row.tempId, { included: checked === true })
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="truncate font-medium">{row.description}</span>
                  {renderBadges(row)}
                </div>
                <div className="text-right">{renderAmount(row)}</div>
                <div onClick={(e) => e.stopPropagation()}>{renderCategoryControl(row)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile cards, grouped by day */}
      <div className="flex min-w-0 flex-col gap-4 sm:hidden">
        {groups.map(([date, dateRows]) => (
          <div key={date} className="flex min-w-0 flex-col gap-1.5">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">
              {formatDateLabel(date, locale)}
            </h2>
            {dateRows.map((row) => (
              <div
                key={row.tempId}
                onClick={() => row.type !== "internal" && toggleSelected(row.tempId)}
                className={cn(
                  "flex min-w-0 flex-col gap-1.5 rounded-lg border px-3 py-2",
                  row.type !== "internal" && "cursor-pointer",
                  selected.has(row.tempId) && "bg-accent",
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                    <Checkbox
                      checked={row.included}
                      disabled={row.type === "internal"}
                      onCheckedChange={(checked) =>
                        onUpdateRow(row.tempId, { included: checked === true })
                      }
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm">
                      <span className="truncate font-medium">{row.description}</span>
                      {renderBadges(row)}
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      {renderAmount(row)}
                      <div onClick={(e) => e.stopPropagation()} className="min-w-0">
                        {renderCategoryControl(row)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onBack} className="sm:w-auto">
            {t("backToOperations")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending} className="w-full sm:w-auto">
            {isPending ? t("confirming") : t("confirmButtonCount", { count: counts.toImport })}
          </Button>
        </div>
      </div>
    </div>
  );
}
