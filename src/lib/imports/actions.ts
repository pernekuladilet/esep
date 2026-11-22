"use server";

import { requireBusiness } from "@/lib/business/current";
import { parseKaspiPdf } from "@/lib/parsers/kaspi-pdf";
import { parseGenericCsv } from "@/lib/parsers/csv";
import { parseGenericExcel } from "@/lib/parsers/excel";
import type { ParsedRow } from "@/lib/parsers/types";
import { categorizeByRules } from "@/lib/categorize/rules";
import { categorizeWithClaude } from "@/lib/categorize/claude";
import { markDuplicates } from "@/lib/imports/dedup";
import type { PreviewRow, ConfirmRow } from "@/lib/imports/types";

export type UploadResult =
  | { ok: true; importId: string; rows: PreviewRow[] }
  | { ok: false; error: string };

async function parseFile(file: File): Promise<{ rows: ParsedRow[]; bank: "kaspi" | null }> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { rows: await parseKaspiPdf(buffer), bank: "kaspi" };
  }

  if (name.endsWith(".csv")) {
    const text = await file.text();
    return { rows: parseGenericCsv(text), bank: null };
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { rows: await parseGenericExcel(buffer), bank: null };
  }

  throw new Error("unsupported_file_type");
}

export async function uploadAndParseStatement(formData: FormData): Promise<UploadResult> {
  const { supabase, userId, business } = await requireBusiness();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "no_file" };
  }

  let parsed: { rows: ParsedRow[]; bank: "kaspi" | null };
  try {
    parsed = await parseFile(file);
  } catch {
    return { ok: false, error: "unsupported_file_type" };
  }

  if (parsed.rows.length === 0) {
    return { ok: false, error: "no_rows_found" };
  }

  const storagePath = `${userId}/${business.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("statements")
    .upload(storagePath, file);

  if (uploadError && process.env.NODE_ENV !== "production") {
    console.error("[imports] storage upload failed:", uploadError.message);
  }

  const { data: importRow, error: importError } = await supabase
    .from("imports")
    .insert({
      business_id: business.id,
      file_name: file.name,
      bank: parsed.bank,
      status: "processing",
      operations_count: parsed.rows.length,
      storage_path: uploadError ? null : storagePath,
    })
    .select("id")
    .single();

  if (importError || !importRow) {
    return { ok: false, error: "import_record_failed" };
  }

  // Rules first; whatever's left (and isn't an internal transfer) goes to Claude in one batch.
  const slugs = new Array<string>(parsed.rows.length).fill("");
  const unresolved: { index: number; description: string; type: "income" | "expense" }[] = [];

  parsed.rows.forEach((row, index) => {
    if (row.type === "internal") return;
    const ruleMatch = categorizeByRules(row.description);
    if (ruleMatch) {
      slugs[index] = ruleMatch;
    } else if (row.type === "income") {
      slugs[index] = "revenue";
    } else {
      unresolved.push({ index, description: row.description, type: row.type });
    }
  });

  if (unresolved.length > 0) {
    const claudeResults = await categorizeWithClaude(unresolved);
    for (const [index, slug] of claudeResults) {
      slugs[index] = slug;
    }
  }

  const dates = parsed.rows.map((r) => r.date).sort();
  const { data: existing } = await supabase
    .from("transactions")
    .select("date, amount, type, description")
    .eq("business_id", business.id)
    .gte("date", dates[0])
    .lte("date", dates[dates.length - 1]);

  const duplicateFlags = markDuplicates(parsed.rows, existing ?? []);

  const rows: PreviewRow[] = parsed.rows.map((row, index) => ({
    tempId: `${index}`,
    date: row.date,
    amountTiyn: row.amountTiyn,
    type: row.type,
    description: row.description,
    categorySlug: slugs[index] || "other",
    isDuplicate: duplicateFlags[index],
    isPersonalLooking: row.isPersonalLooking,
    included: row.type !== "internal" && !duplicateFlags[index] && !row.isPersonalLooking,
  }));

  return { ok: true, importId: importRow.id as string, rows };
}

export async function confirmImport(
  importId: string,
  rows: ConfirmRow[],
): Promise<{ ok: boolean; inserted: number }> {
  const { supabase, business } = await requireBusiness();

  const { data: importRow } = await supabase
    .from("imports")
    .select("id, bank")
    .eq("id", importId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!importRow) {
    return { ok: false, inserted: 0 };
  }

  const source = importRow.bank === "kaspi" ? "kaspi" : "csv";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("is_system", true);
  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug as string, c.id]));

  const toInsert = rows
    .filter((row) => row.included)
    .map((row) => ({
      business_id: business.id,
      date: row.date,
      type: row.type,
      amount: row.amountTiyn,
      description: row.description,
      category_id: categoryIdBySlug.get(row.categorySlug) ?? null,
      source,
      import_id: importId,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("transactions").insert(toInsert);
    if (error && process.env.NODE_ENV !== "production") {
      console.error("[imports] confirmImport insert failed:", error.message);
    }
  }

  await supabase
    .from("imports")
    .update({ status: "done", operations_count: toInsert.length })
    .eq("id", importId);

  return { ok: true, inserted: toInsert.length };
}
