"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  Active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Suspended: "bg-red-500/10 text-red-400 border-red-500/20",
};

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }

    fetch("/api/admin/users", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.users); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.status.toLowerCase().includes(q) ||
      u.balance.toLowerCase().includes(q)
    );
  }, [users, search]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged      = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => { setPage(1); }, [search]);

  const goTo = (id: string) => router.push(`/admin/users/${id}`);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Users</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">All registered accounts on the platform.</p>
        </div>
        <p className="text-[12px] text-slate-500">
          {loading ? "—" : `${total.toLocaleString()} user${total === 1 ? "" : "s"}`}
        </p>
      </motion.div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, status…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[14px] font-semibold text-slate-500">
              {search ? "No users match your search." : "No users yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards (< sm) */}
            <ul className="sm:hidden divide-y divide-slate-800">
              {paged.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => goTo(u.id)}
                    className="w-full text-left p-4 hover:bg-slate-800/40 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-white truncate">{u.name}</p>
                        <Badge label={u.status} colorClass={STATUS_COLORS[u.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </div>
                      <p className="text-[12px] text-slate-400 truncate">{u.email}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-slate-500">{u.phone || "—"}</p>
                        <p className="text-[12px] font-semibold text-white">{u.balance}</p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Name", "Email", "Phone", "Balance", "Status", "Joined"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => goTo(u.id)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {initials(u.name)}
                          </div>
                          <p className="text-[13px] font-semibold text-white whitespace-nowrap">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap max-w-[200px] truncate">{u.email}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 whitespace-nowrap hidden md:table-cell">{u.phone || "—"}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap">{u.balance}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={u.status} colorClass={STATUS_COLORS[u.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap hidden lg:table-cell">{u.joined}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
