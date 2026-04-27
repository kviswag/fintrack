export const CATEGORIES = [
  "General",
  "Food",
  "Travel",
  "Bills",
  "Shopping",
] as const;

export type CategoryType = typeof CATEGORIES[number];