import { AI_CHAT_DAILY_LIMITS, type Plan } from "@/lib/assistant/constants";

export function getDailyLimit(plan: Plan): number | null {
  return AI_CHAT_DAILY_LIMITS[plan];
}

/** `limit === null` means unlimited — never over. */
export function isOverLimit(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit;
}
