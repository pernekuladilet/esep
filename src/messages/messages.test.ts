import { describe, expect, it } from "vitest";
import ru from "./ru.json";
import kk from "./kk.json";
import en from "./en.json";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("message catalogs", () => {
  it("expose the same keys across ru, kk and en", () => {
    const ruKeys = keys(ru).sort();
    expect(keys(kk).sort()).toEqual(ruKeys);
    expect(keys(en).sort()).toEqual(ruKeys);
  });
});
