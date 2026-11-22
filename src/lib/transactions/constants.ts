export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_SOURCES = ["manual", "kaspi", "halyk", "csv", "demo"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];
