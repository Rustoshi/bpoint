"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { useUser } from "@/lib/hooks/useUser";

// ─── Stat Cards ────────────────────────────────────────────────────────────────

const stats = [
  {
    id: "balance",
    label: "Available Balance",
    value: "₦0.00",
    sub: "Ready to withdraw",
    accent: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    border: "border-blue-100",
    textAccent: "text-blue-600",
    action: { label: "Fund Account", href: "/dashboard/fund" },
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    badge: null,
  },
  {
    id: "pending",
    label: "Pending Orders",
    value: "0",
    sub: "Awaiting review",
    accent: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    border: "border-amber-100",
    textAccent: "text-amber-600",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: null,
  },
];

// ─── Quick Actions ─────────────────────────────────────────────────────────────

function buildQuickActions(unreadMessages: number) { return [
  {
    label: "Trade Giftcard",
    desc: "Sell your gift cards instantly",
    href: "/dashboard/trade",
    gradient: "from-blue-600 to-blue-400",
    shadow: "shadow-blue-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: "Recover Missing Code",
    desc: "Scratched off or unreadable gift card code? Submit evidence and we'll recover it",
    href: "/dashboard/recover",
    gradient: "from-violet-600 to-purple-400",
    shadow: "shadow-purple-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    label: "Consignment Box Proof",
    desc: "Request a video proof for your consignment box delivery",
    href: "/dashboard/consignment",
    gradient: "from-orange-500 to-amber-400",
    shadow: "shadow-orange-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Editing",
    desc: "Photo retouching, document editing & clean-up",
    href: "/dashboard/editing",
    gradient: "from-pink-500 to-rose-400",
    shadow: "shadow-pink-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    label: "Lipsync Video",
    desc: "Create lipsync content",
    href: "/dashboard/lipsync",
    gradient: "from-cyan-500 to-teal-400",
    shadow: "shadow-cyan-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    desc: "Chat with support",
    href: "/dashboard/messages",
    gradient: "from-indigo-600 to-blue-500",
    shadow: "shadow-indigo-200",
    badge: unreadMessages > 0 ? unreadMessages : null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Payment History",
    desc: "View all transactions",
    href: "/dashboard/payment-history",
    gradient: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: "Settings",
    desc: "Account & preferences",
    href: "/dashboard/settings",
    gradient: "from-slate-600 to-slate-500",
    shadow: "shadow-slate-200",
    badge: null,
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]; }

// ─── Status badge helper ────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Approved:   "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Paid out": "text-blue-700 bg-blue-50 border-blue-200",
  Reviewing:  "text-amber-700 bg-amber-50 border-amber-200",
  Pending:    "text-amber-700 bg-amber-50 border-amber-200",
  Processing: "text-violet-700 bg-violet-50 border-violet-200",
  Completed:  "text-emerald-700 bg-emerald-50 border-emerald-200",
  Cancelled:  "text-red-700 bg-red-50 border-red-200",
  Rejected:   "text-red-700 bg-red-50 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Reviewing" || status === "Processing" || status === "Pending" ? "animate-pulse" : ""} bg-current`} />
      {status}
    </span>
  );
}

// ─── Table row types ──────────────────────────────────────────────────────────

type TradeRow = {
  id: string;
  brand: string;
  brandColor: string;
  amount: string;
  rate: string;
  payout: string;
  date: string;
  status: string;
};


const tradeColumns: Column<TradeRow>[] = [
  {
    key: "brand", header: "Gift Card", width: "w-[200px]",
    searchValue: (r) => r.brand + r.id,
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${r.brandColor} flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0`}>
          {r.brand[0]}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-800">{r.brand}</p>
          <p className="text-[11px] text-slate-400">{r.id}</p>
        </div>
      </div>
    ),
  },
  {
    key: "amount", header: "Amount",
    searchValue: (r) => r.amount,
    render: (r) => <span className="text-[13px] text-slate-700">{r.amount}</span>,
  },
  {
    key: "rate", header: "Rate",
    searchValue: (r) => r.rate,
    render: (r) => <span className="text-[13px] text-slate-500">{r.rate}</span>,
  },
  {
    key: "payout", header: "Payout",
    searchValue: (r) => r.payout,
    render: (r) => <span className="text-[13px] font-semibold text-slate-800">{r.payout}</span>,
  },
  {
    key: "date", header: "Date",
    searchValue: (r) => r.date,
    render: (r) => <span className="text-[12px] text-slate-400">{r.date}</span>,
  },
  {
    key: "status", header: "Status",
    searchValue: (r) => r.status,
    render: (r) => <StatusBadge status={r.status} />,
  },
];

type ServiceOrderRow = {
  id: string;
  type: "Lipsync" | "Editing" | "Consignment" | "Code Recovery";
  typeColor: string;
  typeIcon: string;
  description: string;
  submittedAt: string;
  updatedAt: string;
  status: string;
};


const serviceTypeIcon: Record<string, React.ReactNode> = {
  Lipsync: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Editing: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Consignment: (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  "Code Recovery": (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const serviceColumns: Column<ServiceOrderRow>[] = [
  {
    key: "type", header: "Service", width: "w-[220px]",
    searchValue: (r) => r.type + r.id,
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${r.typeColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          {serviceTypeIcon[r.type]}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-800">{r.type}</p>
          <p className="text-[11px] text-slate-400">{r.id}</p>
        </div>
      </div>
    ),
  },
  {
    key: "description", header: "Description",
    searchValue: (r) => r.description,
    render: (r) => <span className="text-[13px] text-slate-600 line-clamp-1">{r.description}</span>,
  },
  {
    key: "submittedAt", header: "Submitted",
    searchValue: (r) => r.submittedAt,
    render: (r) => <span className="text-[12px] text-slate-400">{r.submittedAt}</span>,
  },
  {
    key: "updatedAt", header: "Last Update",
    searchValue: (r) => r.updatedAt,
    render: (r) => <span className="text-[12px] text-slate-400">{r.updatedAt}</span>,
  },
  {
    key: "status", header: "Status",
    searchValue: (r) => r.status,
    render: (r) => <StatusBadge status={r.status} />,
  },
];

function serviceTypeColor(type: string) {
  switch (type) {
    case "Lipsync":       return "bg-gradient-to-br from-cyan-500 to-teal-400";
    case "Editing":       return "bg-gradient-to-br from-pink-500 to-rose-400";
    case "Consignment":   return "bg-gradient-to-br from-orange-500 to-amber-400";
    case "Code Recovery": return "bg-gradient-to-br from-violet-600 to-purple-400";
    default:              return "bg-slate-400";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// brand colour map for trade table rows from API (brand name → tailwind class)
const BRAND_COLORS: Record<string, string> = {
  amazon: "bg-amber-500", itunes: "bg-pink-500", "google-play": "bg-green-500",
  steam: "bg-slate-700", xbox: "bg-green-600", walmart: "bg-blue-600",
  ebay: "bg-yellow-500", netflix: "bg-red-600", nike: "bg-slate-900",
  sephora: "bg-black", target: "bg-red-500", "best-buy": "bg-blue-700",
  visa: "bg-blue-800", mastercard: "bg-orange-600", amex: "bg-cyan-700",
  "razer-gold": "bg-lime-600",
};
function brandColor(brand: string) {
  return BRAND_COLORS[brand.toLowerCase().replace(/\s+/g, "-")] ?? "bg-slate-400";
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [orders, setOrders] = useState<ServiceOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName ?? null;

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    // stats (pending orders + unread messages)
    fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPendingOrders(d.pendingOrders);
          setUnreadMessages(d.unreadMessages ?? 0);
        }
      })
      .catch(() => {});

    // trade history table
    fetch("/api/dashboard/trades", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTrades(
            d.trades.map((t: { id: string; brand: string; amount: string; rate: string; payout: string; date: string; status: string }) => ({
              ...t,
              brandColor: brandColor(t.brand),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setTradesLoading(false));

    // service orders table
    fetch("/api/dashboard/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrders(
            d.orders.map((o: { id: string; type: string; description: string; submittedAt: string; updatedAt: string; status: string }) => ({
              ...o,
              typeColor: serviceTypeColor(o.type),
              typeIcon: "",
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  const fmtBalance = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

  const liveStats = stats.map((s) => {
    if (s.id === "balance") {
      return {
        ...s,
        value: userLoading ? "—" : fmtBalance(user?.walletBalance ?? 0),
        sub: userLoading ? "" : user?.walletBalance ? "Ready to withdraw" : "Ready to withdraw",
      };
    }
    if (s.id === "pending") {
      return {
        ...s,
        value: pendingOrders === null ? "—" : String(pendingOrders),
        sub: pendingOrders === null ? "" : pendingOrders === 0 ? "No pending orders" : "Awaiting review",
      };
    }
    return s;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Greeting ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-[1.4rem] font-extrabold text-slate-900 tracking-tight">
          {userLoading ? (
            <span className="inline-block w-48 h-7 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <>{greeting}{firstName ? `, ${firstName}` : ""} 👋</>
          )}
        </h2>
        <p className="text-[14px] text-slate-500 mt-0.5">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {liveStats.map((s) => (
          <motion.div
            key={s.id}
            variants={item}
            className={`relative bg-white rounded-2xl border ${s.border} p-5 overflow-hidden group hover:shadow-md transition-shadow duration-200`}
          >
            {/* Gradient top bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${s.accent}`} />

            {/* Large ghost icon */}
            <div className={`absolute -right-3 -bottom-3 w-20 h-20 rounded-full ${s.bg} opacity-60 flex items-center justify-center`}>
              <div className={`${s.textAccent} opacity-30 scale-150`}>{s.icon}</div>
            </div>

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
                {(userLoading && s.id === "balance") || (pendingOrders === null && s.id === "pending") ? (
                  <div className="w-28 h-8 bg-slate-200 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-[2rem] font-extrabold text-slate-900 leading-none tracking-tight">{s.value}</p>
                )}
                <p className="text-[12px] text-slate-400 mt-1.5">{s.sub}</p>
                {s.action && (
                  <Link
                    href={s.action.href}
                    className={`inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-lg text-[12px] font-bold ${s.textAccent} ${s.bg} border ${s.border} hover:brightness-95 transition-all`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {s.action.label}
                  </Link>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.textAccent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {s.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-slate-800">Quick Actions</h3>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch"
        >
          {buildQuickActions(unreadMessages).map((action) => (
            <motion.div key={action.href} variants={item} className="h-full">
              <Link
                href={action.href}
                className="group relative bg-white rounded-2xl border border-slate-200 p-4 flex flex-col h-full hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:shadow-none active:bg-slate-50 transition-all duration-150 overflow-hidden cursor-pointer select-none"
              >
                {/* Subtle gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-200`} />

                {/* Icon row */}
                <div className="relative flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md ${action.shadow} flex-shrink-0`}>
                    {action.icon}
                  </div>
                  {action.badge != null && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </div>

                {/* Label — fixed 2-line clamp so all cards use same vertical space */}
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">
                    {action.label}
                  </p>
                  {/* Arrow pinned to bottom-right */}
                  <div className="flex justify-end mt-2">
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors duration-150" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Recent Trades datatable ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Trade History</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">All your giftcard trade orders</p>
          </div>
          <Link href="/dashboard/trade" className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 hover:underline font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New trade
          </Link>
        </div>
        <DataTable
          columns={tradeColumns}
          data={trades}
          loading={tradesLoading}
          rowKey={(r) => r.id}
          pageSize={6}
          searchPlaceholder="Search by brand, ID, status..."
          emptyIcon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          emptyTitle="No trades yet"
          emptyDesc="Your giftcard trades will appear here."
          emptyAction={
            <Link href="/dashboard/trade" className="px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Make your first trade
            </Link>
          }
        />
      </motion.div>

      {/* ── Service Orders datatable ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.32 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Service Orders</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Lipsync, editing, consignment & code recovery requests</p>
          </div>
        </div>
        <DataTable
          columns={serviceColumns}
          data={orders}
          loading={ordersLoading}
          rowKey={(r) => r.id}
          pageSize={6}
          searchPlaceholder="Search by service, ID, status, description..."
          emptyIcon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          emptyTitle="No service orders yet"
          emptyDesc="Your lipsync, editing, consignment and recovery orders will appear here."
        />
      </motion.div>

    </div>
  );
}
