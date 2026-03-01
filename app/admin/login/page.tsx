"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/admin/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const text = await response.text();
      let data: { success?: boolean; error?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          setError("Server returned invalid response. Try again.");
          setLoading(false);
          return;
        }
      }

      if (response.ok && data.success) {
        // Wait a bit for cookie to be set
        await new Promise(resolve => setTimeout(resolve, 200));
        // Force navigation
        window.location.href = "/admin/properties";
      } else {
        setError(data.error || (response.ok ? "Incorrect password." : `Server error (${response.status}). Try again.`));
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Error: ${err.message || "Network error. Please check console."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <p>Default password: <strong>admin123</strong></p>
          <p>Change it in .env.local file</p>
        </div>
      </div>
    </div>
  );
}
