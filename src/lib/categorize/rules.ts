// Keyword -> system category slug. Case-insensitive substring match against
// the transaction's description. Order matters only in that the first
// matching rule wins, so more specific keywords are listed first.
//
// Keywords are generic brand/service names, not anything from any specific
// user's statement — safe to keep in the repo. Covers common Kazakhstani
// merchants so more rows get a deterministic category instead of falling
// through to the Claude API (or "other" when there's no key).
const RULES: Array<{ keywords: string[]; slug: string }> = [
  {
    // Supermarkets, wholesale/supply, and online marketplaces a retail or
    // food-service business would buy stock from.
    slug: "cogs",
    keywords: [
      "magnum",
      "mix market",
      "city market",
      "kopeyka",
      "small",
      "metro cash",
      "galmart",
      "ramstore",
      "anvar",
      "arbuz.kz",
      "wildberries",
      "ozon.kz",
      "satu.kz",
      "оптовая база",
      "оптовый рынок",
      "барахолка",
      "привоз",
    ],
  },
  {
    slug: "rent",
    keywords: ["аренда", "rent"],
  },
  {
    // "қазақтелеком" (Kazakh "Қ") is a distinct string from "казахтелеком"
    // (Cyrillic "К") — real statements use the Kazakh spelling, so both are
    // needed or utility payments silently fall through.
    slug: "utilities",
    keywords: [
      "казахтелеком",
      "қазақтелеком",
      "коммунал",
      "утилит",
      "utility",
      "кск",
      "жкх",
      "beeline",
      "kcell",
      "activ",
      "tele2",
      "altel",
    ],
  },
  {
    slug: "salary",
    keywords: ["зарплата", "зп сотрудник", "payroll", "salary"],
  },
  {
    slug: "taxes",
    // Bare "tax" is deliberately excluded — it's a substring of "taxi" and
    // would wrongly catch ride-hailing rows (which map to "other" below).
    keywords: ["налог", "гос пошлина", "tax payment", "кгд", "пеня"],
  },
  {
    slug: "advertising",
    keywords: [
      "реклама",
      "google ads",
      "meta ads",
      "facebook ads",
      "instagram ads",
      "advertising",
      "yandex direct",
      "яндекс директ",
      "tiktok ads",
    ],
  },
  {
    // Pharmacies, fuel, and ride-hailing don't fit any other category for
    // most small businesses — map them to "other" explicitly so they're
    // resolved deterministically instead of spending a Claude call on them.
    slug: "other",
    keywords: [
      "аптека",
      "apteka",
      "europharma",
      "азс",
      "helios",
      "sinooil",
      "gaskar",
      "яндекс такси",
      "yandex taxi",
      "indriver",
      "indrive",
    ],
  },
];

/** Returns a system category slug for a rule match, or null if none apply. */
export function categorizeByRules(description: string): string | null {
  const lower = description.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.slug;
  }
  return null;
}
