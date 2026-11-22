import { PDFParse } from "pdf-parse";
import { type ParsedRow, isPersonalLooking } from "@/lib/parsers/types";

// Kaspi renders "Перевод на свой счёт" / "Поступление со своего счёта" —
// transfers between the user's own Kaspi accounts. Not income, not expense.
const INTERNAL_OPERATIONS = new Set([
  "Перевод на свой счет",
  "Перевод на свой счёт",
  "Поступление со своего счета",
  "Поступление со своего счёта",
]);

function isTransactionRow(row: string[]): boolean {
  return row.length === 4 && /^\d{2}\.\d{2}\.\d{2}$/.test(row[0]);
}

function parseKaspiDate(raw: string): string {
  const [dd, mm, yy] = raw.split(".");
  return `20${yy}-${mm}-${dd}`;
}

/** "- 10 532,80 ₸ (- 23,20 USD)" -> { tiyn: 1053280, isIncome: false } */
function parseKaspiAmount(raw: string): { tiyn: number; isIncome: boolean } {
  const leading = raw.split("(")[0].trim();
  const isIncome = leading.startsWith("+");
  const numeric = leading.replace(/[+\-₸\s]/g, "").replace(",", ".");
  const tenge = Number.parseFloat(numeric);
  return { tiyn: Math.round(tenge * 100), isIncome };
}

/**
 * Pure row parser — takes the flat list of 4-column transaction rows exactly
 * as `PDFParse#getTable()` returns them (table headers already filtered out
 * by the caller via `isTransactionRow`). Kept separate from PDF I/O so it's
 * directly unit-testable against a fixture.
 */
export function parseKaspiRows(rows: string[][]): ParsedRow[] {
  return rows.filter(isTransactionRow).map((row) => {
    const [dateRaw, amountRaw, operationRaw, detailsRaw] = row;
    const operation = operationRaw.trim();
    const { tiyn, isIncome } = parseKaspiAmount(amountRaw);
    const description = detailsRaw.replace(/\s*\n\s*/g, ", ").trim();
    const isInternal = INTERNAL_OPERATIONS.has(operation);
    const type = isInternal ? "internal" : isIncome ? "income" : "expense";

    return {
      date: parseKaspiDate(dateRaw),
      amountTiyn: tiyn,
      type,
      rawOperation: operation,
      description,
      isPersonalLooking: isPersonalLooking(description, operation, type),
    };
  });
}

export async function parseKaspiPdf(buffer: Buffer): Promise<ParsedRow[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getTable();
    const rows: string[][] = [];
    for (const page of result.pages) {
      for (const table of page.tables ?? []) {
        rows.push(...table.filter(isTransactionRow));
      }
    }
    return parseKaspiRows(rows);
  } finally {
    await parser.destroy();
  }
}
