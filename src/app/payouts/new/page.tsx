"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  role: "OPS" | "FINANCE";
}

interface Vendor {
  _id: string;
  name: string;
}

export default function NewPayoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"UPI" | "IMPS" | "NEFT">("UPI");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me");
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      if (meData.user.role !== "OPS") {
        setError("Only OPS users can create payouts.");
        setLoading(false);
        return;
      }

      const vRes = await fetch("/api/vendors");
      if (!vRes.ok) {
        const vErr = await vRes.json().catch(() => ({}));
        setError(vErr.error ?? "Failed to load vendors");
        setLoading(false);
        return;
      }
      const vData = await vRes.json();
      setVendors(vData.vendors ?? []);
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          amount: Number(amount),
          mode,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create payout");
        return;
      }

      router.push("/payouts");
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6 w-full sm:w-auto">
            <span className="text-base sm:text-lg font-bold text-slate-900">
              Payout Management
            </span>
            <nav className="flex gap-3 sm:gap-4 text-sm">
              <Link
                href="/payouts"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Payouts
              </Link>
              <Link
                href="/vendors"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Vendors
              </Link>
            </nav>
          </div>
          {user && (
            <div className="text-xs text-slate-600 text-right bg-slate-50 px-3 py-1.5 rounded-md">
              <div className="font-medium">{user.email}</div>
              <div className="uppercase text-[11px] tracking-wide font-semibold text-slate-500">
                {user.role}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              New Payout
            </h1>
            <p className="text-sm text-slate-700 mt-1">
              Create a draft payout for a vendor. OPS can submit later.
            </p>
          </div>
          <Link
            href="/payouts"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              Vendor<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
            >
              <option value="" className="text-slate-500">Select a vendor</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id} className="text-slate-900">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">
                Amount (INR)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">
                Mode<span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "UPI" | "IMPS" | "NEFT")
                }
                required
              >
                <option value="UPI" className="text-slate-900">UPI</option>
                <option value="IMPS" className="text-slate-900">IMPS</option>
                <option value="NEFT" className="text-slate-900">NEFT</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              Note
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-400"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note about this payout"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !!error}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
          >
            {submitting ? "Creating…" : "Create Draft"}
          </button>
        </form>
      </main>
    </div>
  );
}

