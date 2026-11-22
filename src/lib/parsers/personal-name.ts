// Kaspi P2P counterparties are typically rendered as "Имя И." / "Имя О.Ф."
// (first name + one or two capitalized initials). This is a best-effort
// heuristic, not a name classifier — false negatives (an all-caps name,
// say) just mean the row isn't hidden by default; the user can still
// toggle it manually. It deliberately never matches registered-business
// names (ИП/ТОО/IP/TOO prefixes, ALL-CAPS merchant codes, domains).
const PERSON_NAME_RE =
  /^\p{Lu}\p{Ll}+(?:\s\p{Lu}\p{Ll}+)?\s\p{Lu}\.(?:\s?\p{Lu}\.)?$/u;
const BUSINESS_PREFIX_RE = /^(ИП|ТОО|IP|TOO)\b/i;

export function looksLikePersonalName(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || BUSINESS_PREFIX_RE.test(trimmed)) return false;
  return PERSON_NAME_RE.test(trimmed);
}

/**
 * Replaces a counterparty name with a generic label before the text ever
 * leaves our server (e.g. to the Claude API) — the real name is never sent.
 */
export function maskPersonalName(text: string, direction: "out" | "in"): string {
  if (!looksLikePersonalName(text)) return text;
  return direction === "out" ? "Перевод физлицу" : "Пополнение от физлица";
}
