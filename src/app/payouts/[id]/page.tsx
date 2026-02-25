"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  vendor_id: Vendor;
  amount: number;
  mode: "UPI" | "IMPS" | "NEFT";
  status: "Draft" | "Submitted" | "Approved" | "Rejected";
  note?: string;
  decision_reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  _id: string;
  action: "CREATED" | "SUBMITTED" | "APPROVED" | "REJECTED";
  performed_by: { email: string; role: "OPS" | "FINANCE" };
  createdAt: string;
}

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const payoutId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [payout, setPayout] = useState<Payout | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

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

        const res = await fetch(`/api/payouts/${payoutId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to load payout");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setPayout(data.payout);
        setAudits(data.audits ?? []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load payout. Please try again.");
        setLoading(false);
      }
    }
    if (payoutId) {
      init();
    }
  }, [payoutId, router]);

  async function performAction(
    type: "submit" | "approve" | "reject"
  ) {
    if (!payout) return;
    let body: unknown;
    let url = `/api/payouts/${payout._id}/${type}`;

    if (type === "reject") {
      const reason = window.prompt("Enter rejection reason (required):");
      if (!reason) return;
      body = { reason };
    }

    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed");
        return;
      }

      // reload payout + audits
      const detailRes = await fetch(`/api/payouts/${payout._id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setPayout(detailData.payout);
        setAudits(detailData.audits ?? []);
      }
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-600">
        Loading…
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">{error ?? "Payout not found"}</p>
          <button
            onClick={() => router.push("/payouts")}
            className="mt-4 inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Back to payouts
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = user?.role === "OPS" && payout.status === "Draft";
  const canApprove = user?.role === "FINANCE" && payout.status === "Submitted";
  const canReject = canApprove;

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

      <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Payout #{payout._id.slice(-6)}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Detailed view with audit history and allowed actions.
            </p>
          </div>
          <button
            onClick={() => router.push("/payouts")}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            ← Back to list
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Vendor</dt>
                <dd className="text-slate-900">{payout.vendor_id.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Amount</dt>
                <dd className="text-slate-900">
                  ₹{payout.amount.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Mode</dt>
                <dd className="text-slate-900">{payout.mode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Status</dt>
                <dd className="text-slate-900">{payout.status}</dd>
              </div>
              {payout.note && (
                <div>
                  <dt className="text-slate-600 mb-1">Note</dt>
                  <dd className="text-slate-900 whitespace-pre-wrap">
                    {payout.note}
                  </dd>
                </div>
              )}
              {payout.status === "Rejected" && payout.decision_reason && (
                <div>
                  <dt className="text-slate-600 mb-1">Rejection reason</dt>
                  <dd className="text-red-700 whitespace-pre-wrap">
                    {payout.decision_reason}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-600">Created at</dt>
                <dd className="text-slate-900">
                  {new Date(payout.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Last updated</dt>
                <dd className="text-slate-900">
                  {new Date(payout.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Allowed actions
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              OPS can create and submit drafts. FINANCE can approve or reject
              submitted payouts. Status jumps are prevented by the backend.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {canSubmit && (
                <button
                  onClick={() => performAction("submit")}
                  disabled={actionBusy}
                  className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
                >
                  {actionBusy ? "Submitting…" : "Submit (OPS)"}
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() => performAction("approve")}
                  disabled={actionBusy}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
                >
                  {actionBusy ? "Approving…" : "Approve (FINANCE)"}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => performAction("reject")}
                  disabled={actionBusy}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 shadow-md hover:shadow-lg transition-all"
                >
                  {actionBusy ? "Rejecting…" : "Reject (FINANCE)"}
                </button>
              )}
              {!canSubmit && !canApprove && !canReject && (
                <p className="text-xs text-slate-500">
                  No actions available for your role and this status.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Audit history
          </h2>
          {audits.length === 0 ? (
            <p className="text-xs text-slate-500">
              No audit entries yet. Actions taken on this payout will appear
              here.
            </p>
          ) : (
            <ol className="space-y-2 text-sm">
              {audits.map((a) => (
                <li
                  key={a._id}
                  className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {a.action}
                    </div>
                    <div className="text-xs text-slate-600">
                      {a.performed_by.email} ({a.performed_by.role})
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}

