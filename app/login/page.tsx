"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    }
  }, []);

  const handleLogin = () => {
    if (!email) return;

    localStorage.setItem("user", email);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-6 rounded-2xl w-80">
        <h2 className="text-xl mb-4">Login</h2>

        <input
          type="email"
          placeholder="Enter email"
          className="w-full p-2 mb-4 rounded bg-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}