"use client";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");

  // 🔥 Load from localStorage on first load
  useEffect(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // 🔥 Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    if (!text || !amount) return;

    const newTransaction = {
      id: Date.now(),
      text,
      amount: parseFloat(amount),
      category,
    };

    setTransactions([newTransaction, ...transactions]);
    setText("");
    setAmount("");
    setCategory("General");
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
          <p className="text-gray-400 cursor-pointer hover:text-white">
            Dashboard
          </p>
          <p className="text-gray-400 cursor-pointer hover:text-white">
            Transactions
          </p>
          <p className="text-gray-400 cursor-pointer hover:text-white">
            Settings
          </p>
        </nav>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="mt-6 text-red-400"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Dashboard
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-2xl">
            <h2 className="text-sm text-gray-400">Balance</h2>
            <p className="text-2xl font-bold">₹{balance}</p>
          </div>

          <div className="bg-gray-900 p-4 rounded-2xl">
            <h2 className="text-sm text-gray-400">Income</h2>
            <p className="text-2xl font-bold text-green-400">
              ₹{income}
            </p>
          </div>

          <div className="bg-gray-900 p-4 rounded-2xl">
            <h2 className="text-sm text-gray-400">Expense</h2>
            <p className="text-2xl font-bold text-red-400">
              ₹{Math.abs(expense)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6">
          <h2 className="text-lg mb-4">Spending Overview</h2>

          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  outerRadius={80}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Add Transaction */}
        <div className="bg-gray-900 p-4 rounded-2xl mb-6">
          <h2 className="text-lg mb-3">Add Transaction</h2>

          <input
            type="text"
            placeholder="Enter description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 mb-2 rounded bg-gray-800"
          />

          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-800"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-800"
          >
            <option>General</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Bills</option>
            <option>Shopping</option>
            <option>Other</option>
          </select>

          <button
            onClick={addTransaction}
            className="w-full bg-blue-600 p-2 rounded"
          >
            Add
          </button>
        </div>

        {/* Transactions */}
        <div className="bg-gray-900 p-4 rounded-2xl">
          <h2 className="text-lg mb-3">Transactions</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-400">No transactions yet</p>
          ) : (
            <ul>
              {transactions.map((t) => (
                <li
  key={t.id}
  className="flex justify-between items-center border-b border-gray-700 py-2"
>
  <div>
    <p>{t.text}</p>
    <p className="text-xs text-gray-400">{t.category}</p>
  </div>

  <div className="flex items-center gap-3">
    <span
      className={
        t.amount > 0 ? "text-green-400" : "text-red-400"
      }
    >
      ₹{t.amount}
    </span>

    <button
      onClick={() => deleteTransaction(t.id)}
      className="bg-red-600 px-2 py-1 rounded hover:bg-red-700 text-sm"
    >
      X
    </button>
  </div>
</li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  );
}