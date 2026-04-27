import {
  Transaction,
  BudgetSummary,
  AllocationBucket,
  CATEGORIES,
  CategoryType,
} from "@/types";

// ─── 50/30/20 Rule constants ──────────────────────────────────────────────────

const BUCKETS_CONFIG: {
  label: string;
  pct: number;
  type: CategoryType;
  color: string;
  categories: string[];
}[] = [
  {
    label: "Essentials",
    pct: 0.5,
    type: "essential",
    color: "#ef4444",
    categories: ["Housing", "Food", "Transport", "Utilities", "Healthcare"],
  },
  {
    label: "Lifestyle",
    pct: 0.3,
    type: "lifestyle",
    color: "#8b5cf6",
    categories: ["Entertainment", "Shopping", "Dining", "Travel"],
  },
  {
    label: "Goals",
    pct: 0.2,
    type: "goal",
    color: "#10b981",
    categories: ["Savings", "Investment"],
  },
];

// ─── Core budget functions ────────────────────────────────────────────────────

function sumByType(transactions: Transaction[], type: CategoryType): number {
  return transactions
    .filter((t) => CATEGORIES[t.category]?.type === type)
    .reduce((acc, t) => acc + Number(t.amount), 0);
}

/**
 * Budget Health Score  (0–100)
 *
 * Scoring model (3 components):
 *
 *  Component A — Remaining buffer (40 pts)
 *    Full 40 pts if ≥40% of salary remains.
 *    Scales linearly to 0 pts at 0% remaining.
 *
 *  Component B — Essentials discipline (30 pts)
 *    Full 30 pts if essentials ≤50% of salary.
 *    Degrades linearly: 0 pts at 100% (all salary on essentials).
 *
 *  Component C — Goal achievement (30 pts)
 *    Full 30 pts if savings/investments ≥20% of salary.
 *    Scales linearly to 0 pts at 0% allocated to goals.
 *
 * Clamped 0–100. Returns integer.
 */
export function computeHealthScore(
  salary: number,
  transactions: Transaction[]
): number {
  if (salary <= 0) return 0;

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const remaining = salary - total;

  const essentials = sumByType(transactions, "essential");
  const goals      = sumByType(transactions, "goal");

  // A: remaining buffer
  const compA = Math.min(40, Math.max(0, (remaining / salary) / 0.4) * 40);

  // B: essentials ratio (lower is better; 0.5 = perfect)
  const essRatio = essentials / salary;
  const compB = essRatio <= 0.5
    ? 30
    : Math.max(0, (1 - (essRatio - 0.5) / 0.5) * 30);

  // C: goals ratio (higher is better; 0.2 = perfect)
  const compC = Math.min(30, (goals / salary / 0.2) * 30);

  return Math.round(Math.min(100, Math.max(0, compA + compB + compC)));
}

export function healthLabel(
  score: number
): BudgetSummary["healthLabel"] {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "At Risk";
}

export function healthColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ─── Full summary builder ─────────────────────────────────────────────────────

export function computeBudgetSummary(
  salary: number,
  transactions: Transaction[]
): BudgetSummary {
  const totalSpent = transactions.reduce(
    (s, t) => s + Number(t.amount),
    0
  );
  const remaining = Math.max(0, salary - totalSpent);
  const score = computeHealthScore(salary, transactions);

  const buckets: AllocationBucket[] = BUCKETS_CONFIG.map((cfg) => ({
    label: cfg.label,
    pct: cfg.pct,
    budget: salary * cfg.pct,
    spent: sumByType(transactions, cfg.type),
    color: cfg.color,
    categories: cfg.categories,
  }));

  return {
    salary,
    totalSpent,
    remaining,
    healthScore: score,
    healthLabel: healthLabel(score),
    buckets,
  };
}

// ─── Trend helper: spending by category for current month ─────────────────────

export function spendingByCategoryThisMonth(
  transactions: Transaction[]
): { category: string; amount: number; color: string; icon: string }[] {
  const now = new Date();
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth()
    );
  });

  const map: Record<string, number> = {};
  thisMonth.forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
  });

  return Object.entries(map)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      color: CATEGORIES[cat]?.color ?? "#6b7280",
      icon: CATEGORIES[cat]?.icon ?? "📦",
    }))
    .sort((a, b) => b.amount - a.amount);
}

// ─── Monthly trend: last 6 months spending ───────────────────────────────────

export function monthlySpendingTrend(
  transactions: Transaction[]
): { month: string; essential: number; lifestyle: number; goals: number }[] {
  const now = new Date();
  const months: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d);
  }

  return months.map((month) => {
    const txns = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getFullYear() === month.getFullYear() &&
        d.getMonth() === month.getMonth()
      );
    });
    return {
      month: month.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      essential: sumByType(txns, "essential"),
      lifestyle: sumByType(txns, "lifestyle"),
      goals: sumByType(txns, "goal"),
    };
  });
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export const formatCurrency = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

export const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.min(100, Math.round((part / total) * 100));
