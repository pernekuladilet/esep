const tengeFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

/** Formats an amount stored in tiyn (1 tenge = 100 tiyn) as "12 345 ₸". */
export function formatTenge(tiyn: number): string {
  return `${tengeFormatter.format(Math.round(tiyn) / 100)} ₸`;
}

/** Parses a tenge amount typed by a user (e.g. "1500.50") into whole tiyn. */
export function tengeToTiyn(input: string): number | null {
  const value = Number.parseFloat(input.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function tiynToTengeInput(tiyn: number): string {
  return (tiyn / 100).toFixed(2);
}

/** Compact axis-tick style formatting: 50000 -> "50K", 1250000 -> "1,3M". */
export function formatTengeCompact(tiyn: number): string {
  const tenge = Math.round(tiyn) / 100;
  const abs = Math.abs(tenge);

  if (abs >= 1_000_000) {
    const millions = tenge / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text.replace(".", ",")}M`;
  }

  if (abs >= 1_000) {
    return `${Math.round(tenge / 1000)}K`;
  }

  return String(Math.round(tenge));
}
