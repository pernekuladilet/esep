export type PreviewRow = {
  tempId: string;
  date: string;
  amountTiyn: number;
  type: "income" | "expense" | "internal";
  description: string;
  categorySlug: string;
  isDuplicate: boolean;
  isPersonalLooking: boolean;
  included: boolean;
};

export type ConfirmRow = {
  date: string;
  amountTiyn: number;
  type: "income" | "expense";
  description: string;
  categorySlug: string;
  included: boolean;
};
