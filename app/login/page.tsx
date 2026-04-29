"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) router.push("/");
  }, []);

  // Email validation
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // 🔥 REAL LOGIN (API)
  const handleLogin = async () => {
    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      // ✅ Save login
      localStorage.setItem("user", email);

      router.push("/");
    } catch (err) {
      setError("Server error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-sm border border-gray-800 shadow-lg">

        <h2 className="text-xl mb-5 text-center font-semibold">
          Welcome Back
        </h2>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-500"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        {/* Password */}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-500"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-sm text-gray-400 cursor-pointer"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-3">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 p-2 rounded disabled:opacity-50 hover:bg-blue-700 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}