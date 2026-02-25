"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          upi_id: upiId || undefined,
          bank_account: bankAccount || undefined,
          ifsc: ifsc || undefined,
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create vendor");
        return;
      }

      router.push("/vendors");
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
        Checking authentication…
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
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Add Vendor
            </h1>
            <p className="text-sm text-slate-700 mt-1">
              Create a new vendor that can receive payouts.
            </p>
          </div>
          <Link
            href="/vendors"
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
          className="space-y-4 bg-white p-5 rounded-xl shadow-md border border-slate-200"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Supplies Pvt. Ltd."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">
                UPI ID
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="acme@upi"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">
                Bank Account
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="123456789012"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800">
              IFSC
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
              placeholder="HDFC0001234"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-semibold text-slate-800"
            >
              Active
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
          >
            {submitting ? "Saving…" : "Save Vendor"}
          </button>
        </form>
      </main>
    </div>
  );
}

