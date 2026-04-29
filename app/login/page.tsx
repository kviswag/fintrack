"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);

  // 🔐 Protect route
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, []);

  // ➕ Add transaction
  const addTransaction = () => {
    if (!text) return;

    let value = 0;

    if (income) {
      value = Math.abs(parseFloat(income));
    } else if (expense) {
      value = -Math.abs(parseFloat(expense));
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
    setIncome("");
    setExpense("");
  };

  // 💰 Calculations
  const total = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* 🔴 Logout */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
          className="bg-red-600 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      <h1 className="text-2xl mb-4">💰 FinTrack Dashboard</h1>

      {/* 💰 Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded">
          <p>Total</p>
          <h2>₹ {total}</h2>
        </div>
        <div className="bg-green-800 p-4 rounded">
          <p>Income</p>
          <h2>₹ {totalIncome}</h2>
        </div>
        <div className="bg-red-800 p-4 rounded">
          <p>Expense</p>
          <h2>₹ {totalExpense}</h2>
        </div>
      </div>

      {/* ➕ Add Transaction */}
      <div className="bg-gray-900 p-4 rounded mb-6">
        <input
          type="text"
          placeholder="Description"
          className="w-full p-2 mb-3 rounded bg-gray-800"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="number"
            placeholder="Income"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="w-full p-2 rounded bg-green-900"
            disabled={expense !== ""}
          />

          <input
            type="number"
            placeholder="Expense"
            value={expense}
            onChange={(e) => setExpense(e.target.value)}
            className="w-full p-2 rounded bg-red-900"
            disabled={income !== ""}
          />
        </div>

        <button
          onClick={addTransaction}
          className="w-full bg-blue-600 p-2 rounded"
        >
          Add Transaction
        </button>
      </div>

      {/* 📜 Transactions */}
      <div className="bg-gray-900 p-4 rounded">
        <h2 className="mb-3">Transactions</h2>

        {transactions.map((t) => (
          <div
            key={t.id}
            className={`flex justify-between p-2 mb-2 rounded ${
              t.amount > 0 ? "bg-green-700" : "bg-red-700"
            }`}
          >
            <span>{t.text}</span>
            <span>₹ {t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}