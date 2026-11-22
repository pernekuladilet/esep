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

export function isPersonalLooking(description: string, operation: string): boolean {
  const lower = description.toLowerCase();
  if (PERSONAL_MERCHANT_KEYWORDS.some((kw) => lower.includes(kw))) return true;

  const isTransfer = /перевод|пополнение/i.test(operation);
  if (isTransfer && looksLikePersonalName(description)) return true;

  return false;
}
