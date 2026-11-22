import type { ParsedRow } from "@/lib/parsers/types";

type ExistingTransaction = {
  date: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
};

function normalize(description: string) {
  return description.trim().toLowerCase();
}

function keyOf(row: { date: string; amount: number; type: string; description: string }) {
  return `${row.date}|${row.amount}|${row.type}|${normalize(row.description)}`;
}

/**
 * Flags a parsed row as a duplicate only if an *already-imported* transaction
 * with the same (date, amount, type, description) exists for this business —
 * by count, not by presence. Two identical rows inside the same fresh
 * statement (e.g. two same-day water purchases) are never duplicates of
 * each other; re-uploading the same statement a second time is what
 * produces duplicates, once per matching existing row.
 */
export function markDuplicates(
  parsedRows: ParsedRow[],
  existing: ExistingTransaction[],
): boolean[] {
  const existingCounts = new Map<string, number>();
  for (const row of existing) {
    const key = keyOf({
      date: row.date,
      amount: row.amount,
      type: row.type,
      description: row.description ?? "",
    });
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  const seenInThisImport = new Map<string, number>();

  return parsedRows.map((row) => {
    if (row.type === "internal") return false;

    const key = keyOf({
      date: row.date,
      amount: row.amountTiyn,
      type: row.type,
      description: row.description,
    });
    const alreadyMatched = seenInThisImport.get(key) ?? 0;
    const availableExisting = existingCounts.get(key) ?? 0;
    const isDuplicate = alreadyMatched < availableExisting;
    seenInThisImport.set(key, alreadyMatched + 1);
    return isDuplicate;
  });
}
