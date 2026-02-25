"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/payouts");
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">
            Payout Management
          </h1>
          <p className="text-sm text-slate-800">
            Sign in as OPS or FINANCE to manage payouts.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@demo.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-xs text-slate-600 space-y-1">
          <p>Seed users (after running seed script):</p>
          <p>OPS: ops@demo.com / ops123</p>
          <p>FINANCE: finance@demo.com / fin123</p>
        </div>
      </div>
    </div>
  );
}

