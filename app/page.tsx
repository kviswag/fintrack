"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");

  // 🔐 Protect route
  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, []);

  // 🔥 Load data
  useEffect(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // 🔥 Save data
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  // ➕ Add transaction
  const addTransaction = () => {
    if (!text) return;

    let value = 0;

    if (incomeInput) {
      value = Math.abs(parseFloat(incomeInput));
    } else if (expenseInput) {
      value = -Math.abs(parseFloat(expenseInput));
    } else {
      return;
    }

    const newTransaction = {
      id: Date.now(),
      text,
      amount: value,
    };

    setTransactions([newTransaction, ...transactions]);
    setText("");
    setIncomeInput("");
    setExpenseInput("");
  };

  const deleteTransaction = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const amounts = transactions.map((t) => t.amount);

  const balance = amounts.reduce((acc, item) => acc + item, 0);
  const income = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => acc + item, 0);

  const expense = amounts
    .filter((item) => item < 0)
    .reduce((acc, item) => acc + item, 0);

  const chartData = [
    { name: "Income", value: income },
    { name: "Expense", value: Math.abs(expense) },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-6">FinTrack</h2>

        <nav className="space-y-3">
          <p className="text-gray-400">Dashboard</p>
          <p className="text-gray-400">Transactions</p>
          <p className="text-gray-400">Settings</p>
        </nav>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
          className="mt-6 text-red-400"
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-2xl">
            <h2 className="text-sm text-gray-400">Balance</h2>
            <p className="text-2xl font-bold">₹{balance}</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
            <h2 className="text-sm text-gray-400">Income</h2>
            <p className="text-2xl text-green-400">₹{income}</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-2xl">
            <h2 className="text-sm text-gray-400">Expense</h2>
            <p className="text-2xl text-red-400">₹{Math.abs(expense)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6">
          <h2 className="mb-4">Spending Overview</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" outerRadius={80}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add Transaction */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6">
          <h2 className="mb-3">Add Transaction</h2>

          <input
            type="text"
            placeholder="Enter The Description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-800"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="number"
              placeholder="Enter Your Income"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              className="w-full p-2 rounded bg-gray-800"
              disabled={expenseInput !== ""}
            />

            <input
              type="number"
              placeholder="Enter Your Expense"
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
              className="w-full p-2 rounded bg-gray-800"
              disabled={incomeInput !== ""}
            />
          </div>

          <button
            onClick={addTransaction}
            className="w-full bg-blue-600 p-2 rounded"
          >
            Add
          </button>
        </div>

        {/* Transactions */}
        <div className="bg-gray-900 p-4 rounded-2xl">
          <h2 className="mb-3">Transactions</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions</p>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between border-b border-gray-700 py-2"
              >
                <span>{t.text}</span>
                <div className="flex gap-3">
                  <span
                    className={
                        t.amount > 0 ? "text-gray-300" : "text-gray-400"
                    }
                  >
                    ₹{t.amount}
                  </span>

                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="text-gray-400"
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}