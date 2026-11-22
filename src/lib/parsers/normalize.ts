/** ISO (2026-11-22) or dot/slash separated (22.11.2026 / 22/11/26). */
export function parseGenericDate(raw: string): string | null {
  const trimmed = raw.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

export function parseGenericAmount(raw: string): { tiyn: number; isIncome: boolean } | null {
  const trimmed = raw.replace(/[₸\s]/g, "").replace(",", ".");
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value)) return null;
  return { tiyn: Math.round(Math.abs(value) * 100), isIncome: value >= 0 };
}

export function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const index = lower.indexOf(candidate);
    if (index !== -1) return index;
  }
  return -1;
}

export const DATE_HEADERS = ["дата", "date", "дата операции"];
export const AMOUNT_HEADERS = ["сумма", "amount", "сумма операции"];
export const DESCRIPTION_HEADERS = ["описание", "детали", "операция", "description", "details"];
