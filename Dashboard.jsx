"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useFinanceStore } from "@/store/financeStore";
import {
  computeBudgetSummary,
  formatCurrency,
  monthlySpendingTrend,
  spendingByCategoryThisMonth,
  healthColor,
} from "@/lib/budget";
import { CATEGORIES, Transaction } from "@/types";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  progress?: number;
}
function StatCard({ label, value, sub, accent = "#0d9488", progress }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{sub}</p>
      )}
      {progress !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, progress)}%`,
              background: progress > 100 ? "#ef4444" : accent,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Health Score Ring ────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const color = healthColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "At Risk";

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg
        viewBox="0 0 120 120"
        width={120}
        height={120}
        aria-label={`Budget Health Score: ${score} out of 100 — ${label}`}
        role="img"
      >
        <title>Budget Health Score</title>
        <circle
          cx={60} cy={60} r={54}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          className="text-neutral-100 dark:text-neutral-800"
        />
        <circle
          cx={60} cy={60} r={54}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x={60} y={56}
          textAnchor="middle"
          fontSize={28}
          fontWeight={600}
          fill={color}
          dominantBaseline="middle"
        >
          {score}
        </text>
        <text
          x={60} y={79}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
          dominantBaseline="middle"
        >
          / 100
        </text>
      </svg>
      <span
        className="rounded-full px-3 py-0.5 text-xs font-semibold"
        style={{
          background: color + "20",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Bucket Bar ───────────────────────────────────────────────────────────────

function BucketBar({
  label,
  pctLabel,
  budget,
  spent,
  color,
}: {
  label: string;
  pctLabel: string;
  budget: number;
  spent: number;
  color: string;
}) {
  const pct = budget > 0 ? Math.min(120, (spent / budget) * 100) : 0;
  const over = spent > budget;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {label}{" "}
          <span className="font-normal text-neutral-400">{pctLabel}</span>
        </span>
        <span className="text-xs">
          <span className={over ? "font-semibold text-red-500" : "text-neutral-700 dark:text-neutral-300"}>
            {formatCurrency(spent)}
          </span>
          <span className="text-neutral-400"> / {formatCurrency(budget)}</span>
          {over && <span className="ml-1 text-red-500">▲</span>}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: over ? "#ef4444" : color,
          }}
        />
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-100 bg-white p-3 text-xs shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <p className="mb-1 font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Recent Transactions List ─────────────────────────────────────────────────

function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Recent Transactions
      </h3>
      <div className="space-y-2">
        {recent.map((txn) => {
          const cat = CATEGORIES[txn.category] ?? CATEGORIES.Other;
          return (
            <div
              key={txn.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: cat.color + "18" }}
                >
                  {cat.icon}
                </span>
                <div>
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {txn.description}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {new Date(txn.date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-red-500">
                -{formatCurrency(Number(txn.amount), 2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { transactions, user } = useFinanceStore();

  const salary = user?.monthly_salary ?? 0;
  const summary = useMemo(
    () => computeBudgetSummary(salary, transactions),
    [salary, transactions]
  );
  const trend = useMemo(() => monthlySpendingTrend(transactions), [transactions]);
  const catSpend = useMemo(() => spendingByCategoryThisMonth(transactions), [transactions]);

  const topCats = catSpend.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* ── Row 1: KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 flex items-center gap-6 rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-1">
          <HealthRing score={summary.healthScore} />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Health Score
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Based on 50/30/20 efficiency
            </p>
          </div>
        </div>

        <StatCard
          label="Monthly Income"
          value={formatCurrency(salary)}
          sub="Net take-home"
          accent="#0d9488"
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(summary.totalSpent)}
          sub={`${Math.round((summary.totalSpent / (salary || 1)) * 100)}% of income`}
          accent="#8b5cf6"
          progress={(summary.totalSpent / (salary || 1)) * 100}
        />
        <StatCard
          label="Remaining"
          value={formatCurrency(summary.remaining)}
          sub={`${Math.round((summary.remaining / (salary || 1)) * 100)}% left`}
          accent="#10b981"
          progress={(summary.remaining / (salary || 1)) * 100}
        />
      </div>

      {/* ── Row 2: 50/30/20 Buckets + Pie ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Budget Allocation — 50 / 30 / 20
          </h3>
          <div className="space-y-4">
            {summary.buckets.map((b) => (
              <BucketBar
                key={b.label}
                label={b.label}
                pctLabel={`(${Math.round(b.pct * 100)}%)`}
                budget={b.budget}
                spent={b.spent}
                color={b.color}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Spending by Category
          </h3>
          {topCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={topCats}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {topCats.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, 2)}
                  contentStyle={{
                    border: "0.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-xs text-neutral-400">
              No transactions this month
            </p>
          )}
        </div>
      </div>

      {/* ── Row 3: Trend Chart + Recent ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            6-Month Spending Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gEss"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLife" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gGoal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<AreaTooltip />} />
              <Area type="monotone" dataKey="essential" name="Essentials" stroke="#ef4444" fill="url(#gEss)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="lifestyle" name="Lifestyle"  stroke="#8b5cf6" fill="url(#gLife)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="goals"     name="Goals"      stroke="#10b981" fill="url(#gGoal)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}
