import { looksLikePersonalName } from "@/lib/parsers/personal-name";

export type ParsedRowType = "income" | "expense" | "internal";

export type ParsedRow = {
  date: string; // YYYY-MM-DD
  amountTiyn: number;
  type: ParsedRowType;
  rawOperation: string;
  description: string;
  isPersonalLooking: boolean;
};

// Keywords that, on a personal Kaspi Gold card, usually mean a personal
// expense rather than business stock/spend. Best-effort, not exhaustive —
// only changes the preview's default checkbox state, nothing else.
const PERSONAL_MERCHANT_KEYWORDS = [
  "wolt",
  "yandex.eda",
  "onay.kz",
  "avtobys",
  "steam",
  "apple.com",
  "google *",
  "google*",
  "youtubepremium",
  "такси",
  "taxi",
  "живая вода",
  "anthropic",
  "claude sub",
];

// Money coming IN is only treated as real business revenue by default when
// it clearly looks like one — a registered counterparty, or explicit
// acquiring/sales language. Everything else (top-ups from another card or
// bank, ATM cash deposits, P2P transfers from a person) defaults to
// "looks personal" so it doesn't inflate income on a personal card used
// for business — the user still toggles it in one click if it is revenue.
const BUSINESS_INCOME_KEYWORDS = [
  "kaspi qr",
  "kaspi pay",
  "эквайринг",
  "выручка",
  "продажа",
];
const BUSINESS_PREFIX_RE = /^(ИП|ТОО|IP|TOO)\b/i;

function isLikelyBusinessIncome(description: string): boolean {
  const trimmed = description.trim();
  const lower = trimmed.toLowerCase();
  if (BUSINESS_PREFIX_RE.test(trimmed)) return true;
  return BUSINESS_INCOME_KEYWORDS.some((kw) => lower.includes(kw));
}

export function isPersonalLooking(
  description: string,
  operation: string,
  type: ParsedRowType = "expense",
): boolean {
  if (type === "income") {
    return !isLikelyBusinessIncome(description);
  }

  const lower = description.toLowerCase();
  if (PERSONAL_MERCHANT_KEYWORDS.some((kw) => lower.includes(kw))) return true;

  const isTransfer = /перевод|пополнение/i.test(operation);
  if (isTransfer && looksLikePersonalName(description)) return true;

  return false;
}
