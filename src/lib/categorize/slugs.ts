export const SYSTEM_CATEGORY_SLUGS = [
  "revenue",
  "cogs",
  "rent",
  "salary",
  "utilities",
  "taxes",
  "advertising",
  "other",
] as const;

export type SystemCategorySlug = (typeof SYSTEM_CATEGORY_SLUGS)[number];

export function isSystemCategorySlug(value: string): value is SystemCategorySlug {
  return (SYSTEM_CATEGORY_SLUGS as readonly string[]).includes(value);
}
