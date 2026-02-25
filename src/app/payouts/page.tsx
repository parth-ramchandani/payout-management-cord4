"use client";

import { useEffect, useState } from "react";
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

interface Payout {
  _id: string;
  vendor_id: Vendor | string;
  amount: number;
  mode: "UPI" | "IMPS" | "NEFT";
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  note?: string;
  decision_reason?: string;
  createdAt: string;
}

const STATUS_OPTIONS: Array<Payout["status"] | "ALL"> = [
  "ALL",
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
];

export default function PayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.status === 401) {
          router.replace("/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const [vRes, pRes] = await Promise.all([
          fetch("/api/vendors"),
          fetch("/api/payouts"),
        ]);

        if (!vRes.ok) {
          const vErr = await vRes.json().catch(() => ({}));
          throw new Error(vErr.error ?? "Failed to load vendors");
        }
        if (!pRes.ok) {
          const pErr = await pRes.json().catch(() => ({}));
          throw new Error(pErr.error ?? "Failed to load payouts");
        }

        const vData = await vRes.json();
        const pData = await pRes.json();

        setVendors(vData.vendors ?? []);
        setPayouts(pData.payouts ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load payouts. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function reloadPayouts(nextStatus = statusFilter, nextVendor = vendorFilter) {
    try {
      const params = new URLSearchParams();
      if (nextStatus !== "ALL") {
        params.set("status", nextStatus);
      }
      if (nextVendor !== "ALL") {
        params.set("vendor_id", nextVendor);
      }
      const res = await fetch(`/api/payouts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load payouts");
      }
      const data = await res.json();
      setPayouts(data.payouts ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load payouts. Please try again.");
    }
  }

  async function handleSubmitPayout(id: string) {
    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/payouts/${id}/submit`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to submit payout");
        return;
      }
      await reloadPayouts();
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleApprovePayout(id: string) {
    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/payouts/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to approve payout");
        return;
      }
      await reloadPayouts();
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleRejectPayout(id: string) {
    const reason = window.prompt("Enter rejection reason (required):");
    if (!reason) {
      return;
    }
    setActionBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/payouts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to reject payout");
        return;
      }
      await reloadPayouts();
    } finally {
      setActionBusyId(null);
    }
  }

  function resolveVendorName(vendorField: Payout["vendor_id"]) {
    if (typeof vendorField !== "string" && vendorField && "name" in vendorField) {
      return vendorField.name;
    }
    const v = vendors.find((x) => x._id === vendorField);
    return v?.name ?? "Unknown";
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
              <span className="font-semibold text-sky-600">Payouts</span>
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

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Payout Requests
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              View and manage vendor payouts with status and vendor filters.
            </p>
          </div>
          {user?.role === "OPS" && (
            <Link
              href="/payouts/new"
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto justify-center"
            >
              + New Payout
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-3 text-sm shadow-sm">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-slate-800 font-semibold whitespace-nowrap">Status:</span>
            <select
              className="flex-1 sm:flex-initial rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={statusFilter}
              onChange={async (e) => {
                const next = e.target.value as (typeof STATUS_OPTIONS)[number];
                setStatusFilter(next);
                await reloadPayouts(next, vendorFilter);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All" : opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-slate-800 font-semibold whitespace-nowrap">Vendor:</span>
            <select
              className="flex-1 sm:flex-initial rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={vendorFilter}
              onChange={async (e) => {
                const next = e.target.value;
                setVendorFilter(next);
                await reloadPayouts(statusFilter, next);
              }}
            >
              <option value="ALL">All</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-slate-600">Loading payouts…</div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Mode
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No payouts yet.
                        </td>
                      </tr>
                    )}
                    {payouts.map((p) => (
                      <tr
                        key={p._id}
                        className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/payouts/${p._id}`)}
                      >
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {resolveVendorName(p.vendor_id)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{p.mode}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                            {p.status}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user?.role === "OPS" && p.status === "Draft" && (
                            <button
                              onClick={() => handleSubmitPayout(p._id)}
                              disabled={actionBusyId === p._id}
                              className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-sm hover:shadow transition-all"
                            >
                              {actionBusyId === p._id ? "Submitting…" : "Submit"}
                            </button>
                          )}
                          {user?.role === "FINANCE" && p.status === "Submitted" && (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleApprovePayout(p._id)}
                                disabled={actionBusyId === p._id}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm hover:shadow transition-all"
                              >
                                {actionBusyId === p._id ? "Approving…" : "Approve"}
                              </button>
                              <button
                                onClick={() => handleRejectPayout(p._id)}
                                disabled={actionBusyId === p._id}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 shadow-sm hover:shadow transition-all"
                              >
                                {actionBusyId === p._id ? "Rejecting…" : "Reject"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {payouts.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-500 shadow-sm">
                  No payouts yet.
                </div>
              )}
              {payouts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/payouts/${p._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {resolveVendorName(p.vendor_id)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 ml-2">
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-lg font-bold text-slate-900">
                        ₹{p.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Mode</p>
                      <p className="text-sm font-medium text-slate-700">{p.mode}</p>
                    </div>
                  </div>
                  <div
                    className="pt-3 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {user?.role === "OPS" && p.status === "Draft" && (
                      <button
                        onClick={() => handleSubmitPayout(p._id)}
                        disabled={actionBusyId === p._id}
                        className="w-full inline-flex items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-sm"
                      >
                        {actionBusyId === p._id ? "Submitting…" : "Submit"}
                      </button>
                    )}
                    {user?.role === "FINANCE" && p.status === "Submitted" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePayout(p._id)}
                          disabled={actionBusyId === p._id}
                          className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm"
                        >
                          {actionBusyId === p._id ? "Approving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleRejectPayout(p._id)}
                          disabled={actionBusyId === p._id}
                          className="flex-1 inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 shadow-sm"
                        >
                          {actionBusyId === p._id ? "Rejecting…" : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

