import Papa from "papaparse";
import { type ParsedRow, isPersonalLooking } from "@/lib/parsers/types";
import {
  DATE_HEADERS,
  AMOUNT_HEADERS,
  DESCRIPTION_HEADERS,
  findColumn,
  parseGenericDate,
  parseGenericAmount,
} from "@/lib/parsers/normalize";

// No real Kaspi/Halyk CSV export sample was available, so this is a
// deliberately generic parser: it looks for a date/amount/description
// column by header name (several common spellings) rather than assuming
// a specific bank's export layout.
export function parseGenericCsv(text: string): ParsedRow[] {
  const { data } = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  if (data.length === 0) return [];

  const [header, ...dataRows] = data;
  const dateCol = findColumn(header, DATE_HEADERS);
  const amountCol = findColumn(header, AMOUNT_HEADERS);
  const descriptionCol = findColumn(header, DESCRIPTION_HEADERS);

  if (dateCol === -1 || amountCol === -1) return [];

  const rows: ParsedRow[] = [];
  for (const row of dataRows) {
    const date = parseGenericDate(row[dateCol] ?? "");
    const amount = parseGenericAmount(row[amountCol] ?? "");
    if (!date || !amount) continue;

    const description = (descriptionCol !== -1 ? row[descriptionCol] : "")?.trim() || "—";
    rows.push({
      date,
      amountTiyn: amount.tiyn,
      type: amount.isIncome ? "income" : "expense",
      rawOperation: "",
      description,
      isPersonalLooking: isPersonalLooking(description, ""),
    });
  }

  return rows;
}
