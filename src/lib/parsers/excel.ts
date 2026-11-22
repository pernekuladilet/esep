import ExcelJS from "exceljs";
import { type ParsedRow, isPersonalLooking } from "@/lib/parsers/types";
import {
  DATE_HEADERS,
  AMOUNT_HEADERS,
  DESCRIPTION_HEADERS,
  findColumn,
  parseGenericDate,
  parseGenericAmount,
} from "@/lib/parsers/normalize";

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "text" in value) return String(value.text);
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value);
}

// Same generic column-by-header approach as the CSV parser — no verified
// Kaspi/Halyk Excel export sample was available either.
export async function parseGenericExcel(buffer: Buffer): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled types predate Node's generic Buffer<T> — same runtime type, just a type-level mismatch.
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1).values as ExcelJS.CellValue[];
  const header = headerRow.slice(1).map(cellToString);

  const dateCol = findColumn(header, DATE_HEADERS);
  const amountCol = findColumn(header, AMOUNT_HEADERS);
  const descriptionCol = findColumn(header, DESCRIPTION_HEADERS);
  if (dateCol === -1 || amountCol === -1) return [];

  const rows: ParsedRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (row.values as ExcelJS.CellValue[]).slice(1).map(cellToString);

    const date = parseGenericDate(values[dateCol] ?? "");
    const amount = parseGenericAmount(values[amountCol] ?? "");
    if (!date || !amount) return;

    const description = (descriptionCol !== -1 ? values[descriptionCol] : "")?.trim() || "—";
    const type = amount.isIncome ? "income" : "expense";
    rows.push({
      date,
      amountTiyn: amount.tiyn,
      type,
      rawOperation: "",
      description,
      isPersonalLooking: isPersonalLooking(description, "", type),
    });
  });

  return rows;
}
