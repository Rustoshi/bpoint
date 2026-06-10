"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Deposit = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountNGN: number;
  status: string;
  receiptUrl: string;
  adminNote: string;
  createdAt: string;
  reviewedAt: string | null;
};

type ApiResp = { success: true; deposits: Deposit[]; total: number; page: number; limit: number } | { success: false; message: string };

const PAGE_SIZE = 20;

const STATUS_TABS: { key: "pending" | "approved" | "rejected" | "all"; label: string }[] = [
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all",      label: "All" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

export default function AdminDepositsPage() {
  const router = useRouter();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);

  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search,       setSearch]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: statusFilter,
      q:      search,
      page:   String(page),
      limit:  String(PAGE_SIZE),
    });
    try {
      const res  = await fetch(`/api/admin/deposits?${params}`, { headers: authHeader() });
      const data = await res.json() as ApiResp;
      if (data.success) { setDeposits(data.deposits); setTotal(data.total); }
      else { setDeposits([]); setTotal(0); }
    } catch {
      setDeposits([]); setTotal(0);
    } finally { setLoading(false); }
  }, [statusFilter, search, page]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goToDeposit = (id: string) => router.push(`/admin/deposits/${id}`);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Pending Deposits</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Review user deposit requests and approve or reject them.</p>
      </motion.div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  statusFilter === t.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, user, amount…"
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table / cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : deposits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[14px] font-semibold text-slate-500">
              {statusFilter === "pending" ? "No pending deposits — you're all caught up!" : "No deposits match your filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-slate-800">
              {deposits.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => goToDeposit(d.id)}
                    className="w-full text-left p-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-white truncate">{d.userName}</p>
                      <Badge label={d.status} colorClass={STATUS_COLORS[d.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{d.userEmail}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500">{fmtDate(d.createdAt)}</p>
                      <p className="text-[14px] font-extrabold text-white">{fmtNGN(d.amountNGN)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["ID", "User", "Amount", "Status", "Submitted"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => goToDeposit(d.id)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">{d.id.slice(-8)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-white">{d.userName}</p>
                        <p className="text-[11px] text-slate-500">{d.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-extrabold text-white whitespace-nowrap">{fmtNGN(d.amountNGN)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={d.status} colorClass={STATUS_COLORS[d.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 border-t border-slate-800 gap-3 flex-wrap">
              <p className="text-[12px] text-slate-500">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-[12px] text-slate-400">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
