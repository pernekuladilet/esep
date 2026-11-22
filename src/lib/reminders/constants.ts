// "weekly"/"yearly" stay valid in the DB check constraint for forward
// compatibility, but the UI only ever offers these three.
export const REMINDER_TYPES = ["tax", "rent", "salary", "custom"] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const REMINDER_REPEATS = ["none", "monthly", "semiannual"] as const;
export type ReminderRepeat = (typeof REMINDER_REPEATS)[number];
