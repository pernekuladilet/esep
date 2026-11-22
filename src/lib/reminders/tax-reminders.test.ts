import { describe, expect, it } from "vitest";
import { computeMissingTaxReminders } from "@/lib/reminders/tax-reminders";

describe("computeMissingTaxReminders", () => {
  it("returns the still-upcoming report and pay deadlines when nothing exists yet", () => {
    const today = new Date(2026, 10, 22); // Nov 22, 2026 -> H2 2026
    const result = computeMissingTaxReminders(today, new Set());

    // H1 2026's deadlines (Aug 2026) are already in the past; only H2 2026's
    // (Feb 2027) are still upcoming.
    expect(result).toEqual([
      { type: "tax", title: "report", date: "2027-02-15", repeat: "semiannual", remind_days_before: 7 },
      { type: "tax", title: "pay", date: "2027-02-25", repeat: "semiannual", remind_days_before: 7 },
    ]);
  });

  it("excludes deadlines that already have a reminder", () => {
    const today = new Date(2026, 10, 22);
    const existing = new Set(["2027-02-15|report"]);
    const result = computeMissingTaxReminders(today, existing);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: "pay", date: "2027-02-25" });
  });

  it("is idempotent: computing again against its own output yields nothing new", () => {
    const today = new Date(2026, 10, 22);
    const first = computeMissingTaxReminders(today, new Set());
    const existingKeys = new Set(first.map((r) => `${r.date}|${r.title}`));
    expect(computeMissingTaxReminders(today, existingKeys)).toEqual([]);
  });

  it("picks up a still-upcoming deadline from a period that just closed", () => {
    // Jan 10, 2027 is H1 2027 by calendar, but H2 2026's Feb 2027 deadlines
    // (which belong to the period that just ended) are still upcoming.
    const today = new Date(2027, 0, 10);
    const result = computeMissingTaxReminders(today, new Set());
    const dates = result.map((r) => r.date);
    expect(dates).toContain("2027-02-15");
    expect(dates).toContain("2027-02-25");
  });
});
