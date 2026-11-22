export const PLANS = ["free", "pro", "business"] as const;
export type Plan = (typeof PLANS)[number];

/** `null` means unlimited (Business tier). */
export const AI_CHAT_DAILY_LIMITS: Record<Plan, number | null> = {
  free: 5,
  pro: 50,
  business: null,
};

export const SUMMARY_PERIOD_OPTIONS = ["thisMonth", "lastMonth", "last3", "last6", "thisYear"] as const;
export type SummaryPeriod = (typeof SUMMARY_PERIOD_OPTIONS)[number];
