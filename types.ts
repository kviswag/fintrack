/**
 * Core type definitions for budget tracking application
 */

export type CategoryType = "essential" | "lifestyle" | "goal";

export type HealthLabel = "Excellent" | "Good" | "Fair" | "At Risk";

export type Theme = "light" | "dark" | "system";

export type Page = "dashboard" | "transactions" | "settings" | "onboarding";

export type SortField = "date" | "amount" | "category" | "description";

export type SortDirection = "asc" | "desc";

export interface Transaction {
  id?: string;
  category: string;
  amount: number;
  date: string | Date;
  description?: string;
}

export interface AllocationBucket {
  label: string;
  pct: number;
  budget: number;
  spent: number;
  color: string;
}

export interface BudgetSummary {
  salary: number;
  totalSpent: number;
  remaining: number;
  healthScore: number;
  healthLabel: HealthLabel;
  buckets: AllocationBucket[];
}

export interface CategoryInfo {
  type: CategoryType;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionCreatePayload {
  category: string;
  amount: number;
  date: string | Date;
  description?: string;
}

export interface TransactionUpdatePayload {
  id: string;
  category?: string;
  amount?: number;
  date?: string | Date;
  description?: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  // Essentials
  Housing: { type: "essential", color: "#ef4444", icon: "🏠" },
  Food: { type: "essential", color: "#ef4444", icon: "🍔" },
  Transport: { type: "essential", color: "#ef4444", icon: "🚗" },
  Utilities: { type: "essential", color: "#ef4444", icon: "💡" },
  Healthcare: { type: "essential", color: "#ef4444", icon: "⚕️" },

  // Lifestyle
  Entertainment: { type: "lifestyle", color: "#8b5cf6", icon: "🎬" },
  Shopping: { type: "lifestyle", color: "#8b5cf6", icon: "🛍️" },
  Dining: { type: "lifestyle", color: "#8b5cf6", icon: "🍽️" },
  Travel: { type: "lifestyle", color: "#8b5cf6", icon: "✈️" },

  // Goals
  Savings: { type: "goal", color: "#10b981", icon: "💰" },
  Investment: { type: "goal", color: "#10b981", icon: "📈" },
};
