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

  it("matches the Kazakh-letter spelling of Qazaqtelecom too", () => {
    expect(categorizeByRules("Услуги Қазақтелеком по лицевому счету")).toBe("utilities");
  });

  it("matches common Kazakhstani supermarket, telecom, and marketplace brands", () => {
    expect(categorizeByRules("Galmart")).toBe("cogs");
    expect(categorizeByRules("Wildberries")).toBe("cogs");
    expect(categorizeByRules("Beeline")).toBe("utilities");
    expect(categorizeByRules("Kcell")).toBe("utilities");
  });

  it("maps pharmacies, fuel, and ride-hailing to 'other' instead of leaving them unmatched", () => {
    expect(categorizeByRules("Аптека Europharma")).toBe("other");
    expect(categorizeByRules("АЗС Helios")).toBe("other");
    expect(categorizeByRules("Yandex Taxi")).toBe("other");
  });

  it("is case-insensitive", () => {
    expect(categorizeByRules("МАГНУМ")).toBeNull(); // only matches the Latin brand spelling
    expect(categorizeByRules("magnum cash&carry")).toBe("cogs");
  });

  it("returns null when nothing matches", () => {
    expect(categorizeByRules("Жанна К.")).toBeNull();
  });
});
