"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  User,
  Transaction,
  SortField,
  SortDirection,
  Theme,
  Page,
  TransactionCreatePayload,
  TransactionUpdatePayload,
  CATEGORIES,
} from "@/types";
import {
  computeBudgetSummary,
  BudgetSummary,
} from "@/lib/budget";

// ─── State shape ──────────────────────────────────────────────────────────────

interface FinanceState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Finance data
  transactions: Transaction[];
  budgetSummary: BudgetSummary | null;

  // UI
  theme: Theme;
  currentPage: Page;
  sidebarOpen: boolean;
  quickAddOpen: boolean;

  // Table state
  search: string;
  sortField: SortField;
  sortDir: SortDirection;
  currentPage_table: number;
  perPage: number;

  // Onboarding
  onboardingComplete: boolean;

  // Loading / error
  loading: boolean;
  error: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface FinanceActions {
  // Auth
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Salary (updates budget summary reactively)
  setSalary: (salary: number) => void;

  // Transactions
  setTransactions: (txns: Transaction[]) => void;
  addTransaction: (txn: Transaction) => void;
  updateTransaction: (patch: TransactionUpdatePayload) => void;
  deleteTransaction: (id: string) => void;

  // UI
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  navigateTo: (page: Page) => void;
  toggleSidebar: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;

  // Table
  setSearch: (q: string) => void;
  setSort: (field: SortField) => void;
  setTablePage: (page: number) => void;

  // Onboarding
  completeOnboarding: (salary: number) => void;

  // Misc
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  recomputeBudget: () => void;
}

type FinanceStore = FinanceState & FinanceActions;

// ─── Store factory ────────────────────────────────────────────────────────────

const INITIAL_STATE: FinanceState = {
  user: null,
  token: null,
  isAuthenticated: false,
  transactions: [],
  budgetSummary: null,
  theme: "system",
  currentPage: "dashboard",
  sidebarOpen: true,
  quickAddOpen: false,
  search: "",
  sortField: "date",
  sortDir: "desc",
  currentPage_table: 1,
  perPage: 20,
  onboardingComplete: false,
  loading: false,
  error: null,
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Auth ────────────────────────────────────────────────────────────────

      login(user, token) {
        set({ user, token, isAuthenticated: true, onboardingComplete: user.monthly_salary > 0 });
        get().recomputeBudget();
      },

      logout() {
        set({ ...INITIAL_STATE, theme: get().theme });
      },

      updateUser(patch) {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, ...patch };
        set({ user: updated });
        if (patch.monthly_salary !== undefined) get().recomputeBudget();
      },

      // ── Salary ──────────────────────────────────────────────────────────────

      setSalary(salary) {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, monthly_salary: salary } });
        get().recomputeBudget();
      },

      // ── Transactions ────────────────────────────────────────────────────────

      setTransactions(txns) {
        set({ transactions: txns });
        get().recomputeBudget();
      },

      addTransaction(txn) {
        set((s) => ({ transactions: [txn, ...s.transactions] }));
        get().recomputeBudget();
      },

      updateTransaction(patch) {
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === patch.id ? { ...t, ...patch } : t
          ),
        }));
        get().recomputeBudget();
      },

      deleteTransaction(id) {
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        get().recomputeBudget();
      },

      // ── UI ──────────────────────────────────────────────────────────────────

      setTheme(theme) {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme() {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },

      navigateTo(page) {
        set({ currentPage: page, search: "" });
      },

      toggleSidebar() {
        set((s) => ({ sidebarOpen: !s.sidebarOpen }));
      },

      openQuickAdd() {
        set({ quickAddOpen: true });
      },

      closeQuickAdd() {
        set({ quickAddOpen: false });
      },

      // ── Table ────────────────────────────────────────────────────────────────

      setSearch(q) {
        set({ search: q, currentPage_table: 1 });
      },

      setSort(field) {
        const { sortField, sortDir } = get();
        if (sortField === field) {
          set({ sortDir: sortDir === "asc" ? "desc" : "asc" });
        } else {
          set({ sortField: field, sortDir: "desc" });
        }
      },

      setTablePage(page) {
        set({ currentPage_table: page });
      },

      // ── Onboarding ───────────────────────────────────────────────────────────

      completeOnboarding(salary) {
        get().setSalary(salary);
        set({ onboardingComplete: true });
      },

      // ── Misc ────────────────────────────────────────────────────────────────

      setLoading(v) {
        set({ loading: v });
      },

      setError(msg) {
        set({ error: msg });
      },

      recomputeBudget() {
        const { user, transactions } = get();
        if (!user) return;
        const summary = computeBudgetSummary(user.monthly_salary, transactions);
        set({ budgetSummary: summary });
      },
    }),
    {
      name: "fintrack-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist UI preferences and cached data locally.
        // Auth tokens are managed via HttpOnly cookies server-side.
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        currentPage: state.currentPage,
        onboardingComplete: state.onboardingComplete,
        // Cache transactions for offline resilience (refresh safety)
        transactions: state.transactions,
        user: state.user,
      }),
    }
  )
);

// ─── Derived selectors (avoid re-renders) ─────────────────────────────────────

export const selectFilteredTransactions = (state: FinanceStore) => {
  let txns = [...state.transactions];

  if (state.search) {
    const q = state.search.toLowerCase();
    txns = txns.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  txns.sort((a, b) => {
    let cmp = 0;
    switch (state.sortField) {
      case "amount":
        cmp = Number(a.amount) - Number(b.amount);
        break;
      case "category":
        cmp = a.category.localeCompare(b.category);
        break;
      case "description":
        cmp = a.description.localeCompare(b.description);
        break;
      default:
        cmp = a.date.localeCompare(b.date);
    }
    return state.sortDir === "asc" ? cmp : -cmp;
  });

  return txns;
};

export const selectPagedTransactions = (state: FinanceStore) => {
  const all = selectFilteredTransactions(state);
  const start = (state.currentPage_table - 1) * state.perPage;
  return {
    transactions: all.slice(start, start + state.perPage),
    total: all.length,
    pages: Math.ceil(all.length / state.perPage),
  };
};

// ─── Theme applicator ─────────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}
