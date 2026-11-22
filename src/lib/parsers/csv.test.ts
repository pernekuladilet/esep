import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseGenericCsv } from "./csv";

const fixtureText = readFileSync(
  join(__dirname, "../../../tests/fixtures/generic-statement.csv"),
  "utf8",
);

describe("parseGenericCsv", () => {
  const rows = parseGenericCsv(fixtureText);

  it("parses every data row", () => {
    expect(rows).toHaveLength(4);
  });

  it("converts DD.MM.YYYY dates to ISO", () => {
    expect(rows[0].date).toBe("2026-11-22");
  });

  it("infers income/expense from the amount sign", () => {
    expect(rows[0].type).toBe("expense");
    expect(rows[1].type).toBe("income");
  });

  it("converts tenge to whole tiyn", () => {
    expect(rows[0].amountTiyn).toBe(185000);
  });

  it("returns an empty array when required columns are missing", () => {
    expect(parseGenericCsv("foo,bar\n1,2")).toEqual([]);
  });
});
