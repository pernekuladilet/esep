import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseKaspiRows } from "./kaspi-pdf";

const fixtureRows: string[][] = JSON.parse(
  readFileSync(join(__dirname, "../../../tests/fixtures/kaspi-statement-rows.json"), "utf8"),
);

describe("parseKaspiRows", () => {
  const rows = parseKaspiRows(fixtureRows);

  it("parses every row in the fixture", () => {
    expect(rows).toHaveLength(fixtureRows.length);
  });

  it("converts dates to YYYY-MM-DD with a 2000s century", () => {
    expect(rows[0].date).toBe("2026-11-22");
  });

  it("converts the amount to whole tiyn and infers income/expense from the sign", () => {
    const purchase = rows.find((r) => r.description === "SMALL");
    expect(purchase?.amountTiyn).toBe(185000);
    expect(purchase?.type).toBe("expense");

    const topUp = rows.find((r) => r.rawOperation === "Пополнение" && r.amountTiyn === 1050000);
    expect(topUp?.type).toBe("income");
  });

  it("strips a parenthetical FX equivalent out of the amount", () => {
    const row = rows.find((r) => r.description === "ANTHROPIC* CLAUDE SUB" && r.type === "expense");
    expect(row?.amountTiyn).toBe(1050000);
  });

  it("flattens a multi-line details cell into one description", () => {
    const row = rows.find((r) => r.description.includes("Курсовая разница"));
    expect(row?.description).toBe("ANTHROPIC* CLAUDE SUB, Курсовая разница");
  });

  it("marks transfers between the user's own accounts as internal, not income/expense", () => {
    const internalRows = rows.filter((r) => r.type === "internal");
    expect(internalRows).toHaveLength(2);
    expect(internalRows.map((r) => r.rawOperation).sort()).toEqual(
      ["Перевод на свой счет", "Поступление со своего счета"].sort(),
    );
  });

  it("flags personal-looking transfers and merchants, but not business ones", () => {
    const toIndividual = rows.find((r) => r.description === "Жанна К.");
    expect(toIndividual?.isPersonalLooking).toBe(true);

    const fromIndividual = rows.find((r) => r.description === "Асхат М.");
    expect(fromIndividual?.isPersonalLooking).toBe(true);

    const wolt = rows.find((r) => r.description === "Wolt");
    expect(wolt?.isPersonalLooking).toBe(true);

    const grocery = rows.find((r) => r.description === "Magnum Cash&Carry");
    expect(grocery?.isPersonalLooking).toBe(false);

    const otherBank = rows.find((r) => r.description === "С карты другого банка");
    expect(otherBank?.isPersonalLooking).toBe(false);
  });

  it("keeps duplicate same-day, same-amount rows from the same statement as separate entries", () => {
    const waterRows = rows.filter((r) => r.description === "Живая Вода");
    expect(waterRows).toHaveLength(2);
  });
});
