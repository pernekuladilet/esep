// Brand-teal-led palette: revenue gets the primary brand teal, expense
// categories are harmonious teal shades plus two restrained accents
// (amber for taxes, slate neutrals) instead of a clashing rainbow.
// Lives outside any "use client" module so server components (e.g. the
// dashboard page) can read it too, not just client-rendered charts.
export const CATEGORY_COLORS: Record<string, string> = {
  revenue: "#0f9b8e",
  cogs: "#0d7d74",
  rent: "#14b8a6",
  salary: "#2dd4bf",
  utilities: "#5eead4",
  taxes: "#f59e0b",
  advertising: "#94a3b8",
  other: "#64748b",
};
