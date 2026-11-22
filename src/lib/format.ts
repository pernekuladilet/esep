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
