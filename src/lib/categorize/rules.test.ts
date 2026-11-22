import { describe, expect, it } from "vitest";
import { categorizeByRules } from "./rules";

describe("categorizeByRules", () => {
  it("matches known grocery/supply merchants to cogs", () => {
    expect(categorizeByRules("Magnum Cash&Carry")).toBe("cogs");
    expect(categorizeByRules("SMALL")).toBe("cogs");
  });

  it("matches rent, utilities, taxes, advertising keywords", () => {
    expect(categorizeByRules("Аренда помещения")).toBe("rent");
    expect(categorizeByRules("Услуги Казахтелеком по лицевому счету")).toBe("utilities");
    expect(categorizeByRules("Налоговый платеж")).toBe("taxes");
    expect(categorizeByRules("Google Ads кампания")).toBe("advertising");
  });

  it("is case-insensitive", () => {
    expect(categorizeByRules("МАГНУМ")).toBeNull(); // only matches the Latin brand spelling
    expect(categorizeByRules("magnum cash&carry")).toBe("cogs");
  });

  it("returns null when nothing matches", () => {
    expect(categorizeByRules("Жанна К.")).toBeNull();
  });
});
