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
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  is_active: boolean;
  createdAt: string;
}

export default function VendorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

        const vRes = await fetch("/api/vendors");
        if (!vRes.ok) {
          const vErr = await vRes.json().catch(() => ({}));
          throw new Error(vErr.error ?? "Failed to load vendors");
        }
        const vData = await vRes.json();
        setVendors(vData.vendors ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load vendors. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function handleDeleteVendor(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this vendor? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete vendor");
        return;
      }
      setVendors((prev) => prev.filter((v) => v._id !== id));
    } finally {
      setDeletingId(null);
    }
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
              <span className="font-semibold text-sky-600">Vendors</span>
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Vendors</h1>
          <Link
            href="/vendors/new"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto justify-center"
          >
            + Add Vendor
          </Link>
        </div>

        {loading && (
          <div className="text-sm text-slate-600">Loading vendors…</div>
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
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        UPI ID
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Bank Account
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        IFSC
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Active
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No vendors yet. Create one to get started.
                        </td>
                      </tr>
                    )}
                    {vendors.map((v) => (
                      <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{v.name}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {v.upi_id || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {v.bank_account || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {v.ifsc || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              v.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {v.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => router.push(`/vendors/${v._id}/edit`)}
                            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v._id)}
                            disabled={deletingId === v._id}
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 shadow-sm transition-all"
                          >
                            {deletingId === v._id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {vendors.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-500 shadow-sm">
                  No vendors yet. Create one to get started.
                </div>
              )}
              {vendors.map((v) => (
                <div
                  key={v._id}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-slate-900">{v.name}</h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ml-2 ${
                        v.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {v.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {v.upi_id && (
                      <div>
                        <p className="text-xs text-slate-500">UPI ID</p>
                        <p className="text-sm font-medium text-slate-700">{v.upi_id}</p>
                      </div>
                    )}
                    {v.bank_account && (
                      <div>
                        <p className="text-xs text-slate-500">Bank Account</p>
                        <p className="text-sm font-medium text-slate-700">{v.bank_account}</p>
                      </div>
                    )}
                    {v.ifsc && (
                      <div>
                        <p className="text-xs text-slate-500">IFSC</p>
                        <p className="text-sm font-medium text-slate-700">{v.ifsc}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => router.push(`/vendors/${v._id}/edit`)}
                      className="flex-1 inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(v._id)}
                      disabled={deletingId === v._id}
                      className="flex-1 inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 shadow-sm"
                    >
                      {deletingId === v._id ? "Deleting…" : "Delete"}
                    </button>
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

