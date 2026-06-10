"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type LookedUpUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  isActive: boolean;
};

type FundResult = {
  fundRequestId: string;
  user: { id: string; name: string; email: string; newWalletBalance: number };
  creditedAmount: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminFundUserPage() {
  const router = useRouter();

  const [email, setEmail]   = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");

  const [lookedUp, setLookedUp] = useState<LookedUpUser | null>(null);
  const [looking,  setLooking]  = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState("");
  const [result,       setResult]       = useState<FundResult | null>(null);

  const lastLookupRef = useRef<string>("");

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
  }, [router]);

  // Debounced auto-lookup
  useEffect(() => {
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) {
      setLookedUp(null);
      setLookupError("");
      return;
    }
    const t = setTimeout(async () => {
      if (e === lastLookupRef.current) return;
      lastLookupRef.current = e;
      setLooking(true);
      setLookupError("");
      try {
        const res  = await fetch(`/api/admin/users/lookup?email=${encodeURIComponent(e)}`, { headers: authHeader() });
        const data = await res.json();
        if (data.success) { setLookedUp(data.user); }
        else { setLookedUp(null); setLookupError(data.message ?? "User not found."); }
      } catch {
        setLookedUp(null);
        setLookupError("Lookup failed.");
      } finally {
        setLooking(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [email]);

  async function submit() {
    setSubmitError("");
    setResult(null);
    const amt = Number(amount);
    if (!EMAIL_RE.test(email.trim())) { setSubmitError("Enter a valid email."); return; }
    if (!Number.isFinite(amt) || amt < 100) { setSubmitError("Amount must be at least ₦100."); return; }

    setSubmitting(true);
    try {
      const res  = await fetch(`/api/admin/fund-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ email: email.trim(), amountNGN: amt, note: note.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to fund user.");
      setResult({
        fundRequestId: data.fundRequestId,
        user:          data.user,
        creditedAmount: data.creditedAmount,
      });
      setEmail(""); setAmount(""); setNote("");
      setLookedUp(null);
      lastLookupRef.current = "";
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to fund user.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setSubmitError("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Fund user</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Credit a user&apos;s wallet directly. This creates an approved deposit entry in their payment history.</p>
      </motion.div>

      {/* Success card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-emerald-200">Wallet credited successfully</p>
                <p className="text-[13px] text-emerald-300/90 mt-0.5">
                  {fmtNGN(result.creditedAmount)} added to <span className="font-semibold">{result.user.name}</span>.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-300/70 uppercase tracking-wider">User email</p>
                    <p className="text-emerald-100 break-all mt-0.5">{result.user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-300/70 uppercase tracking-wider">New balance</p>
                    <p className="text-emerald-100 font-bold mt-0.5">{fmtNGN(result.user.newWalletBalance)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/users/${result.user.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold"
                  >
                    View user
                  </Link>
                  <button
                    onClick={reset}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold"
                  >
                    Fund another
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      {!result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {/* Email + lookup */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />

            <AnimatePresence mode="wait">
              {looking && (
                <motion.p
                  key="looking"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[11px] text-slate-500 mt-2"
                >
                  Looking up…
                </motion.p>
              )}
              {!looking && lookupError && (
                <motion.p
                  key="lookup-err"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[12px] text-amber-400 mt-2"
                >
                  {lookupError}
                </motion.p>
              )}
              {!looking && lookedUp && (
                <motion.div
                  key="lookup"
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="mt-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                    {initials(lookedUp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{lookedUp.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{lookedUp.phone || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Balance</p>
                    <p className="text-[13px] font-bold text-white">{fmtNGN(lookedUp.walletBalance)}</p>
                  </div>
                  {!lookedUp.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-red-500/10 text-red-400 border-red-500/20">
                      Suspended
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount (₦)</label>
            <input
              type="number"
              inputMode="decimal"
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Minimum ₦100. Maximum ₦10,000,000 per transaction.</p>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Note <span className="text-slate-600 normal-case font-normal">(optional)</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Reason for funding (saved on the payment record)"
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-[11px] text-slate-600 mt-1 text-right">{note.length}/500</p>
          </div>

          {submitError && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[13px] font-semibold"
            >
              Cancel
            </Link>
            <button
              onClick={submit}
              disabled={submitting || !lookedUp || !amount}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Crediting…" : lookedUp ? `Credit ${amount ? fmtNGN(Number(amount) || 0) : "wallet"}` : "Credit wallet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
