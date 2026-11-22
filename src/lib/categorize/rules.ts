// Keyword -> system category slug. Case-insensitive substring match against
// the transaction's description. Order matters only in that the first
// matching rule wins, so more specific keywords are listed first.
const RULES: Array<{ keywords: string[]; slug: string }> = [
  {
    slug: "cogs",
    keywords: ["magnum", "mix market", "city market", "kopeyka", "small", "metro cash"],
  },
  {
    slug: "rent",
    keywords: ["аренда", "rent"],
  },
  {
    slug: "utilities",
    keywords: ["казахтелеком", "коммунал", "утилит", "utility", "кск", "жкх"],
  },
  {
    slug: "salary",
    keywords: ["зарплата", "зп сотрудник", "payroll", "salary"],
  },
  {
    slug: "taxes",
    keywords: ["налог", "гос пошлина", "tax"],
  },
  {
    slug: "advertising",
    keywords: ["реклама", "google ads", "meta ads", "facebook ads", "instagram ads", "advertising"],
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
