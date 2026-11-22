import {
  SIMPLIFIED_DEADLINES,
  SIMPLIFIED_INCOME_LIMIT_TIYN,
} from "@/lib/tax/config";

export type Half = 1 | 2;

export function getHalfYear(date: Date): { year: number; half: Half } {
  const half: Half = date.getMonth() < 6 ? 1 : 2;
  return { year: date.getFullYear(), half };
}

/** Formats a Date's LOCAL calendar day as "YYYY-MM-DD" — never via toISOString(),
 * which converts through UTC and can shift the date by a day depending on the
 * server's timezone offset. */
export function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive [start, end] ISO date bounds ("YYYY-MM-DD") of a half-year period. */
export function getPeriodRange(year: number, half: Half): { startIso: string; endIso: string } {
  const iso = isoLocal;
  if (half === 1) {
    return { startIso: iso(new Date(year, 0, 1)), endIso: iso(new Date(year, 5, 30)) };
  }
  return { startIso: iso(new Date(year, 6, 1)), endIso: iso(new Date(year, 11, 31)) };
}

/** Report (сдать форму 910.00) and payment deadlines for a given half-year period. */
export function getDeadlines(year: number, half: Half): { reportDate: Date; payDate: Date } {
  const config = SIMPLIFIED_DEADLINES[half];
  const deadlineYear = year + config.deadlineYearOffset;
  const [reportMonth, reportDay] = config.reportMonthDay.split("-").map(Number);
  const [payMonth, payDay] = config.payMonthDay.split("-").map(Number);
  return {
    reportDate: new Date(deadlineYear, reportMonth - 1, reportDay),
    payDate: new Date(deadlineYear, payMonth - 1, payDay),
  };
}

/** `round(income * rate / 100)`, in tiyn. */
export function calculateTax(incomeTiyn: number, ratePercent: number): number {
  return Math.round((incomeTiyn * ratePercent) / 100);
}

export function getIncomeLimitProgress(annualIncomeTiyn: number): {
  ratio: number;
  warnAt80: boolean;
  exceeded: boolean;
} {
  const ratio = SIMPLIFIED_INCOME_LIMIT_TIYN > 0 ? annualIncomeTiyn / SIMPLIFIED_INCOME_LIMIT_TIYN : 0;
  return {
    ratio,
    warnAt80: ratio >= 0.8,
    exceeded: ratio >= 1,
  };
}

/** Whole days from `from` to `date`; negative when `date` is in the past. */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(date) - startOfDay(from)) / msPerDay);
}
