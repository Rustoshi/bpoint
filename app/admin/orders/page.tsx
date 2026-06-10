"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ServiceKey = "trade" | "recovery" | "consignment" | "editing" | "lipsync" | "fund";

type Order = {
  id: string;
  type: string;             // Display name e.g. "Trade", "Fund Request"
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  amount: string;
  amountRaw: number;
  status: string;
  adminNote: string;
  date: string;             // ISO
};

type ApiResp = { success: true; orders: Order[]; total: number; page: number; limit: number } | { success: false; message: string };

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPE_TABS: { key: "all" | ServiceKey; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "trade",       label: "Trade" },
  { key: "recovery",    label: "Recovery" },
  { key: "consignment", label: "Consignment" },
  { key: "editing",     label: "Editing" },
  { key: "lipsync",     label: "Lipsync" },
  { key: "fund",        label: "Fund" },
];

const STATUS_TABS: { key: "all" | "pending" | "active" | "done"; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active",  label: "In Progress" },
  { key: "done",    label: "Done" },
];

const DISPLAY_TO_KEY: Record<string, ServiceKey> = {
  "Trade":        "trade",
  "Recovery":     "recovery",
  "Consignment":  "consignment",
  "Editing":      "editing",
  "Lipsync":      "lipsync",
  "Fund Request": "fund",
};

const TYPE_COLORS: Record<string, string> = {
  "Trade":        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Recovery":     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Consignment":  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Editing":      "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Lipsync":      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Fund Request": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  pending:        "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reviewing:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "in-progress":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paid:           "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  delivered:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  recovered:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected:       "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  unrecoverable:  "bg-red-500/10 text-red-400 border-red-500/20",
};

const PAGE_SIZE = 20;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
            value === t.key
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full sm:w-72">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ID, user, description…"
        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const [typeFilter,   setTypeFilter]   = useState<"all" | ServiceKey>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active" | "done">("all");
  const [search,       setSearch]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type:   typeFilter,
      status: statusFilter,
      q:      search,
      page:   String(page),
      limit:  String(PAGE_SIZE),
    });
    try {
      const res  = await fetch(`/api/admin/orders?${params}`, { headers: authHeader() });
      const data = await res.json() as ApiResp;
      if (data.success) {
        setOrders(data.orders);
        setTotal(data.total);
      } else {
        setOrders([]);
        setTotal(0);
      }
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search, page]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
  }, [router]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { setPage(1); }, [typeFilter, statusFilter]);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goToOrder = (o: Order) => {
    const key = DISPLAY_TO_KEY[o.type];
    router.push(`/admin/orders/${o.id}?type=${key}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Orders</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">All service orders across the platform.</p>
      </motion.div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Tabs tabs={TYPE_TABS} value={typeFilter} onChange={setTypeFilter} />
          <SearchInput value={search} onChange={setSearch} />
        </div>
        <Tabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[14px] font-semibold text-slate-500">No orders match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  {["ID", "Type", "User", "Description", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => goToOrder(o)}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">{o.id.slice(-8)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge label={o.type} colorClass={TYPE_COLORS[o.type] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-slate-300 whitespace-nowrap max-w-[140px] truncate">{o.userName}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400 max-w-[240px] truncate">{o.description}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap">{o.amount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge label={o.status} colorClass={STATUS_COLORS[o.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{fmtDate(o.date)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800">
              <p className="text-[12px] text-slate-500">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-1">
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
          </div>
        )}
      </div>
    </div>
  );
}
