"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Deposit = {
  id: string;
  userId: string;
  amountNGN: number;
  status: string;
  receiptUrl: string;
  adminNote: string;
  createdAt: string;
  reviewedAt: string | null;
};

type DepUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  bankDetails: { accountNumber: string; bankName: string; nameOnBank: string } | null;
  isActive: boolean;
};

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

const fmtDate = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

// ─── UI bits ───────────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="text-[13px] text-slate-200 mt-1 break-words">{value || <span className="text-slate-600">—</span>}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDepositDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id     = params.id;

  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [user,    setUser]    = useState<DepUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [note, setNote]               = useState("");
  const [acting, setActing]           = useState<"approve" | "reject" | null>(null);
  const [confirm, setConfirm]         = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState("");
  const [flash, setFlash]             = useState("");

  const [showReceipt, setShowReceipt] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch(`/api/admin/deposits/${id}`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to load deposit.");
      setDeposit(data.deposit);
      setUser(data.user);
      setNote(data.deposit.adminNote ?? "");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load deposit.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
    load();
  }, [router, load]);

  async function decide(action: "approve" | "reject") {
    setActing(action);
    setActionError("");
    setFlash("");
    try {
      const res  = await fetch(`/api/admin/deposits/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ action, note: note.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to decide.");
      setFlash(action === "approve"
        ? "Deposit approved. Wallet credited and the user's payment history shows it as Approved."
        : "Deposit rejected. The user's payment history shows it as Rejected.");
      setConfirm(null);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to decide.");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (loadError || !deposit) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/deposits" className="text-[13px] text-slate-400 hover:text-white">← Back to deposits</Link>
        <div className="mt-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-[14px] text-red-300 font-semibold">{loadError || "Deposit not found."}</p>
        </div>
      </div>
    );
  }

  const isImage     = IMG_EXT.test(deposit.receiptUrl);
  const isPending   = deposit.status === "pending";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/deposits" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to deposits
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label="Deposit" colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
              <Badge label={deposit.status} colorClass={STATUS_COLORS[deposit.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
            </div>
            <h2 className="text-[1.2rem] font-extrabold text-white tracking-tight">Deposit detail</h2>
            <p className="text-[11px] font-mono text-slate-500">{deposit.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount</p>
            <p className="text-[1.6rem] font-extrabold text-white">{fmtNGN(deposit.amountNGN)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Submitted {fmtDate(deposit.createdAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* Flash banners */}
      {flash && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-[13px] text-emerald-300 font-semibold">{flash}</p>
        </div>
      )}

      {/* User */}
      {user && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">User</h3>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-white">{user.name}</p>
              <p className="text-[12px] text-slate-400 break-all">{user.email}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user.phone || "—"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Wallet</p>
              <p className="text-[15px] font-bold text-white">{fmtNGN(user.walletBalance)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/users/${user.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold"
            >
              View profile
            </Link>
            <Link
              href={`/admin/messages?userId=${user.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold"
            >
              Message
            </Link>
          </div>
        </div>
      )}

      {/* Proof of payment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Proof of payment</h3>
          <a
            href={deposit.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-blue-400 hover:text-blue-300 font-semibold"
          >
            Open original ↗
          </a>
        </div>
        {isImage ? (
          <button
            type="button"
            onClick={() => setShowReceipt(true)}
            className="block w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deposit.receiptUrl}
              alt="Deposit receipt"
              className="w-full max-h-[480px] object-contain bg-slate-900"
            />
          </button>
        ) : (
          <a
            href={deposit.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white">View receipt</p>
              <p className="text-[11px] text-slate-500 break-all">{deposit.receiptUrl}</p>
            </div>
          </a>
        )}
      </div>

      {/* Decision panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Decision</h3>

        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Admin note <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Reason / context — visible to the user on their payment history."
            className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500 resize-none"
          />
          <p className="text-[10px] text-slate-600 text-right mt-1">{note.length}/500</p>
        </div>

        {actionError && <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{actionError}</p>}

        {!isPending && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 space-y-1">
            <p className="text-[12px] text-slate-300">
              This deposit is <span className="font-semibold">{deposit.status}</span>{deposit.reviewedAt ? ` since ${fmtDate(deposit.reviewedAt)}` : ""}.
            </p>
            {deposit.adminNote && (
              <p className="text-[11px] text-slate-500">Note: {deposit.adminNote}</p>
            )}
          </div>
        )}

        {isPending && confirm === null && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setConfirm("approve")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold"
            >
              Approve & credit {fmtNGN(deposit.amountNGN)}
            </button>
            <button
              onClick={() => setConfirm("reject")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[13px] font-bold"
            >
              Reject deposit
            </button>
          </div>
        )}

        <AnimatePresence>
          {isPending && confirm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`rounded-xl border px-4 py-3 ${confirm === "approve" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
            >
              <p className={`text-[13px] font-semibold ${confirm === "approve" ? "text-emerald-300" : "text-red-300"}`}>
                {confirm === "approve"
                  ? `Confirm: credit ${fmtNGN(deposit.amountNGN)} to ${user?.name ?? "the user"}'s wallet?`
                  : `Confirm: reject this deposit?`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setConfirm(null)}
                  disabled={!!acting}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => decide(confirm)}
                  disabled={!!acting}
                  className={`px-3 py-1.5 rounded-lg text-white text-[12px] font-bold disabled:opacity-50 ${
                    confirm === "approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  {acting === confirm ? "Working…" : confirm === "approve" ? "Yes, approve" : "Yes, reject"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReceipt(false)}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deposit.receiptUrl}
              alt="Deposit receipt"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain cursor-default"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
