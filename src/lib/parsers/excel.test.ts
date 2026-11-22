import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseGenericExcel } from "./excel";

const fixtureBuffer = readFileSync(
  join(__dirname, "../../../tests/fixtures/generic-statement.xlsx"),
);

describe("parseGenericExcel", () => {
  it("parses every data row with correct dates, amounts, and sign-based type", async () => {
    const rows = await parseGenericExcel(fixtureBuffer);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      date: "2026-11-22",
      amountTiyn: 185000,
      type: "expense",
      description: "SMALL",
    });
    expect(rows[1].type).toBe("income");
  });

  it("returns an empty array when required columns are missing", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Sheet1").addRow(["foo", "bar"]);
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());

    expect(await parseGenericExcel(buffer)).toEqual([]);
  });
});
