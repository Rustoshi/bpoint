"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stats = { totalUsers: number; pendingOrders: number; pendingDeposits: number; unreadMessages: number };

type PendingDeposit = {
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

type PendingOrder = {
  id: string;
  type: string;
  userId: string;
  userName: string;
  description: string;
  amount: string;
  status: string;
  date: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: string;
  balanceRaw: number;
  isActive: boolean;
  status: string;
  joined: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  "Trade":        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Recovery":     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Consignment":  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Editing":      "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Lipsync":      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Fund Request": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  pending:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reviewing:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "in-progress":"bg-blue-500/10 text-blue-400 border-blue-500/20",
  Active:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Suspended:    "bg-red-500/10 text-red-400 border-red-500/20",
};

const PAGE_SIZE = 10;

const DISPLAY_TO_KEY: Record<string, string> = {
  "Trade":        "trade",
  "Recovery":     "recovery",
  "Consignment":  "consignment",
  "Editing":      "editing",
  "Lipsync":      "lipsync",
  "Fund Request": "fund",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, loading, href, accent, icon }: {
  label: string; value: number; sub: string; loading: boolean;
  href: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 hover:shadow-lg block">
      <div className={`h-[3px] bg-gradient-to-r ${accent} w-full`} />
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
          {loading ? (
            <div className="w-20 h-8 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <p className="text-[2rem] font-extrabold text-white leading-none">{value.toLocaleString()}</p>
          )}
          <p className="text-[12px] text-slate-500 mt-1.5">{sub}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-800 text-slate-400 group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
          {icon}
        </div>
      </div>
    </Link>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
      <p className="text-[12px] text-slate-500">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors ${p === page ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Quick Actions ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Pending Orders",   href: "/admin/orders",    gradient: "from-amber-500 to-orange-400",   icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { label: "Pending Deposits", href: "/admin/deposits",  gradient: "from-emerald-500 to-green-400",  icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { label: "Users",          href: "/admin/users",     gradient: "from-blue-500 to-cyan-400",      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { label: "Fund User",      href: "/admin/fund-user", gradient: "from-emerald-500 to-green-400",  icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { label: "Message User",   href: "/admin/messages",  gradient: "from-violet-500 to-purple-400",  icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
  { label: "Settings",       href: "/admin/settings",  gradient: "from-slate-500 to-slate-400",    icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingOrders: 0, pendingDeposits: 0, unreadMessages: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);

  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(true);
  const [depositSearch, setDepositSearch] = useState("");
  const [depositPage, setDepositPage] = useState(1);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  // ── Auth guard ──
  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }

    fetch("/api/admin/stats", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    fetch("/api/admin/pending-orders", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));

    fetch("/api/admin/deposits?status=pending&limit=50", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setDeposits(d.deposits); })
      .catch(() => {})
      .finally(() => setDepositsLoading(false));

    fetch("/api/admin/users", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.users); })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [router]);

  // ── Filtered & paginated data ──
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase();
    return orders.filter((o) =>
      !q || o.id.toLowerCase().includes(q) || o.type.toLowerCase().includes(q) ||
      o.userName.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) ||
      o.amount.toLowerCase().includes(q) || o.status.toLowerCase().includes(q)
    );
  }, [orders, orderSearch]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, orderPage]);

  const filteredDeposits = useMemo(() => {
    const q = depositSearch.toLowerCase();
    return deposits.filter((d) =>
      !q || d.id.toLowerCase().includes(q) ||
      d.userName.toLowerCase().includes(q) ||
      d.userEmail.toLowerCase().includes(q) ||
      String(d.amountNGN).includes(q)
    );
  }, [deposits, depositSearch]);

  const pagedDeposits = useMemo(() => {
    const start = (depositPage - 1) * PAGE_SIZE;
    return filteredDeposits.slice(start, start + PAGE_SIZE);
  }, [filteredDeposits, depositPage]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) || u.status.toLowerCase().includes(q) ||
      u.balance.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Greeting ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Admin Overview</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Here&apos;s a live summary of your platform.</p>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <StatCard label="Total Users" value={stats.totalUsers} sub="Registered accounts" loading={statsLoading}
            href="/admin/users" accent="from-blue-500 to-cyan-400"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Pending Orders" value={stats.pendingOrders} sub="Awaiting review" loading={statsLoading}
            href="/admin/orders" accent="from-amber-500 to-orange-400"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Pending Deposits" value={stats.pendingDeposits} sub="Awaiting approval" loading={statsLoading}
            href="/admin/deposits" accent="from-emerald-500 to-green-400"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Unread Messages" value={stats.unreadMessages} sub="From users" loading={statsLoading}
            href="/admin/messages" accent="from-violet-500 to-purple-400"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
          />
        </motion.div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}
              className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full gap-3 hover:border-slate-700 active:scale-[0.97] active:bg-slate-800/60 transition-all duration-150 overflow-hidden cursor-pointer select-none">
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-200`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                {action.icon}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <p className="text-[12px] font-bold text-slate-300 leading-snug line-clamp-2">{action.label}</p>
                <div className="flex justify-end mt-2">
                  <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Pending Orders Table ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.22 }}>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-800">
            <div>
              <h3 className="text-[15px] font-bold text-white">Pending Orders</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">All unresolved orders across all services</p>
            </div>
            <div className="sm:w-64">
              <SearchInput value={orderSearch} onChange={(v) => { setOrderSearch(v); setOrderPage(1); }} placeholder="Search orders…" />
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : pagedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[14px] font-semibold text-slate-500">
                {orderSearch ? "No orders match your search" : "No pending orders"}
              </p>
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
                  {pagedOrders.map((order, i) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => router.push(`/admin/orders/${order.id}?type=${DISPLAY_TO_KEY[order.type] ?? "trade"}`)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">{order.id.slice(-8)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={order.type} colorClass={TYPE_COLORS[order.type] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-300 whitespace-nowrap max-w-[120px] truncate">{order.userName}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 max-w-[200px] truncate">{order.description}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap">{order.amount}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={order.status} colorClass={STATUS_COLORS[order.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{order.date}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 pb-4">
                <Pagination page={orderPage} total={filteredOrders.length} pageSize={PAGE_SIZE} onChange={setOrderPage} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Pending Deposits Table ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.26 }}>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-800">
            <div>
              <h3 className="text-[15px] font-bold text-white">Pending Deposits</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">User wallet top-up requests awaiting approval</p>
            </div>
            <div className="sm:w-64">
              <SearchInput value={depositSearch} onChange={(v) => { setDepositSearch(v); setDepositPage(1); }} placeholder="Search deposits…" />
            </div>
          </div>

          {depositsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : pagedDeposits.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[14px] font-semibold text-slate-500">
                {depositSearch ? "No deposits match your search" : "No pending deposits"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["ID", "User", "Amount", "Submitted"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedDeposits.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => router.push(`/admin/deposits/${d.id}`)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">{d.id.slice(-8)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-white">{d.userName}</p>
                        <p className="text-[11px] text-slate-500">{d.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-extrabold text-white whitespace-nowrap">
                        {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(d.amountNGN)}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d.createdAt))}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 pb-4">
                <Pagination page={depositPage} total={filteredDeposits.length} pageSize={PAGE_SIZE} onChange={setDepositPage} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Users Table ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-800">
            <div>
              <h3 className="text-[15px] font-bold text-white">Users</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">All registered user accounts</p>
            </div>
            <div className="sm:w-64">
              <SearchInput value={userSearch} onChange={(v) => { setUserSearch(v); setUserPage(1); }} placeholder="Search users…" />
            </div>
          </div>

          {usersLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : pagedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-[14px] font-semibold text-slate-500">
                {userSearch ? "No users match your search" : "No users yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Name", "Email", "Phone", "Balance", "Status", "Joined"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <p className="text-[13px] font-semibold text-white whitespace-nowrap">{user.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">{user.email}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap">{user.phone || "—"}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap">{user.balance}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={user.status} colorClass={STATUS_COLORS[user.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{user.joined}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 pb-4">
                <Pagination page={userPage} total={filteredUsers.length} pageSize={PAGE_SIZE} onChange={setUserPage} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
