"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TxType = "deposit" | "trade" | "recovery" | "consignment" | "editing" | "lipsync";

type TxEntry = {
  id: string;
  type: TxType;
  typeLabel: string;
  description: string;
  amountNGN: number;
  amountFormatted: string;
  direction: "credit" | "debit";
  status: string;
  date: string;
  rawDate: string;
};

// ─── Config maps ───────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS: { label: string; value: TxType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Gift Card Trades", value: "trade" },
  { label: "Code Recovery", value: "recovery" },
  { label: "Consignment", value: "consignment" },
  { label: "Editing", value: "editing" },
  { label: "Lipsync", value: "lipsync" },
];

const TYPE_ICON: Record<TxType, React.ReactNode> = {
  deposit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  trade: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  recovery: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  consignment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  editing: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  lipsync: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const TYPE_COLOR: Record<TxType, string> = {
  deposit:     "bg-emerald-100 text-emerald-600",
  trade:       "bg-blue-100 text-blue-600",
  recovery:    "bg-amber-100 text-amber-600",
  consignment: "bg-orange-100 text-orange-600",
  editing:     "bg-pink-100 text-pink-600",
  lipsync:     "bg-cyan-100 text-cyan-600",
};

const STATUS_STYLE: Record<string, string> = {
  Pending:       "text-amber-700 bg-amber-50 border-amber-200",
  Reviewing:     "text-violet-700 bg-violet-50 border-violet-200",
  Approved:      "text-emerald-700 bg-emerald-50 border-emerald-200",
  Paid:          "text-emerald-700 bg-emerald-50 border-emerald-200",
  Recovered:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  Delivered:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  Completed:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rejected:      "text-red-600 bg-red-50 border-red-200",
  Unrecoverable: "text-red-600 bg-red-50 border-red-200",
  Cancelled:     "text-slate-500 bg-slate-50 border-slate-200",
  "In Progress": "text-blue-700 bg-blue-50 border-blue-200",
  Processing:    "text-blue-700 bg-blue-50 border-blue-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLE[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  const pulse = status === "Pending" || status === "Reviewing" || status === "Processing" || status === "In Progress";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

const PAGE_SIZE = 15;

// ─── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[140, 80, 200, 100, 80, 90].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-4 bg-slate-100 rounded animate-pulse`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-[1.1rem] font-extrabold text-slate-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentHistoryPage() {
  const [entries, setEntries] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
  const [dirFilter, setDirFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/payment-history", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setEntries(d.entries); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, typeFilter, dirFilter]);

  const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  // ── Filtered & searched entries ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (dirFilter !== "all" && e.direction !== dirFilter) return false;
      if (q) {
        return (
          e.id.toLowerCase().includes(q) ||
          e.typeLabel.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q) ||
          e.amountFormatted.toLowerCase().includes(q) ||
          e.date.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, search, typeFilter, dirFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Summary stats ──
  const totalCredits = entries.filter((e) => e.direction === "credit" && (e.status === "Approved" || e.status === "Paid")).reduce((s, e) => s + e.amountNGN, 0);
  const totalDebits = entries.filter((e) => e.direction === "debit").reduce((s, e) => s + e.amountNGN, 0);
  const pendingCount = entries.filter((e) => e.status === "Pending").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Payment History</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          All your transactions — deposits, trades, and service payments.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          label="Total Transactions"
          value={String(entries.length)}
          sub={`${filtered.length} matching filters`}
          color="bg-slate-100 text-slate-500"
        />
        <SummaryCard
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>}
          label="Total Credited"
          value={fmtNGN(totalCredits)}
          sub="Approved deposits & trades"
          color="bg-emerald-100 text-emerald-600"
        />
        <SummaryCard
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>}
          label="Total Spent"
          value={fmtNGN(totalDebits)}
          sub="Service fees paid"
          color="bg-red-100 text-red-500"
        />
        <SummaryCard
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          label="Pending"
          value={String(pendingCount)}
          sub="Awaiting review"
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by ID, description, type, amount, date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Direction filter */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
            {([["all", "All"], ["credit", "Credits"], ["debit", "Debits"]] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDirFilter(val)}
                className={`px-3 py-2 text-[12px] font-semibold transition-colors
                  ${dirFilter === val ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${typeFilter === opt.value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[110px]">ID</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[140px]">Type</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[130px]">Amount</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[100px]">Date</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-[110px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
              ) : pageEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-[14px] font-bold text-slate-600">
                        {entries.length === 0 ? "No transactions yet" : "No results found"}
                      </p>
                      <p className="text-[13px] text-slate-400">
                        {entries.length === 0
                          ? "Your payment history will appear here once you make a transaction."
                          : "Try adjusting your search or filters."}
                      </p>
                      {(search || typeFilter !== "all" || dirFilter !== "all") && (
                        <button
                          onClick={() => { setSearch(""); setTypeFilter("all"); setDirFilter("all"); }}
                          className="mt-1 text-[12px] font-semibold text-blue-500 hover:text-blue-600 underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                pageEntries.map((entry, i) => (
                  <motion.tr
                    key={entry.id + entry.rawDate}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-mono font-semibold text-slate-400">{entry.id}</span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[entry.type]}`}>
                          {TYPE_ICON[entry.type]}
                        </span>
                        <span className="text-[12px] font-semibold text-slate-600">{entry.typeLabel}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] text-slate-700 leading-snug max-w-xs">{entry.description}</p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                          ${entry.direction === "credit" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            {entry.direction === "credit"
                              ? <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              : <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            }
                          </svg>
                        </span>
                        <span className={`text-[13px] font-bold ${entry.direction === "credit" ? "text-emerald-700" : "text-red-600"}`}>
                          {entry.direction === "credit" ? "+" : "-"}{entry.amountFormatted}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-slate-400 whitespace-nowrap">{entry.date}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={entry.status} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="px-4 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[12px] text-slate-400">
              Showing <span className="font-semibold text-slate-600">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-slate-600">{filtered.length}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px] text-slate-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors
                        ${page === p ? "bg-slate-800 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
