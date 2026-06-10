"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserDetail = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
  isActive: boolean;
  role: string;
  walletBalance: number;
  bankDetails: { accountNumber: string; bankName: string; nameOnBank: string } | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

type Counts = {
  trade: number; recovery: number; consignment: number;
  editing: number; lipsync: number; fund: number; total: number;
};

type RecentOrder = {
  id: string;
  type: string;
  typeKey: string;
  description: string;
  amount: number;
  status: string;
  date: string;
};

type EditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isEmailVerified: boolean;
  walletBalance: string;
  accountNumber: string;
  bankName: string;
  nameOnBank: string;
};

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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

const fmtDateShort = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)) : "—";

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

function fromUser(u: UserDetail): EditForm {
  return {
    firstName:       u.firstName,
    lastName:        u.lastName,
    email:           u.email,
    phone:           u.phone,
    isActive:        u.isActive,
    isEmailVerified: u.isEmailVerified,
    walletBalance:   String(u.walletBalance ?? 0),
    accountNumber:   u.bankDetails?.accountNumber ?? "",
    bankName:        u.bankDetails?.bankName ?? "",
    nameOnBank:      u.bankDetails?.nameOnBank ?? "",
  };
}

// ─── UI bits ───────────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${colorClass}`}>
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

function Input({
  label, value, onChange, type = "text", placeholder, mono,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500 ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-[13px] text-slate-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-[1.2rem] font-extrabold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id     = params.id;

  const [user,   setUser]   = useState<UserDetail | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState<EditForm | null>(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [flash, setFlash]       = useState("");

  const [confirmReset, setConfirmReset]   = useState(false);
  const [resetting, setResetting]         = useState(false);
  const [generatedPwd, setGeneratedPwd]   = useState("");
  const [copied, setCopied]               = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch(`/api/admin/users/${id}`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to load user.");
      setUser(data.user);
      setCounts(data.counts);
      setRecent(data.recentOrders);
      setForm(fromUser(data.user));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
    load();
  }, [router, load]);

  function cancelEdit() {
    if (user) setForm(fromUser(user));
    setEditing(false);
    setError("");
  }

  async function saveChanges() {
    if (!form || !user) return;
    setSaving(true);
    setError("");
    setFlash("");
    try {
      const payload: Record<string, unknown> = {};
      if (form.firstName !== user.firstName)             payload.firstName       = form.firstName;
      if (form.lastName  !== user.lastName)              payload.lastName        = form.lastName;
      if (form.email     !== user.email)                 payload.email           = form.email;
      if (form.phone     !== user.phone)                 payload.phone           = form.phone;
      if (form.isActive  !== user.isActive)              payload.isActive        = form.isActive;
      if (form.isEmailVerified !== user.isEmailVerified) payload.isEmailVerified = form.isEmailVerified;
      if (Number(form.walletBalance) !== user.walletBalance) payload.walletBalance = Number(form.walletBalance);

      const bankChanged =
        (user.bankDetails?.accountNumber ?? "") !== form.accountNumber ||
        (user.bankDetails?.bankName      ?? "") !== form.bankName ||
        (user.bankDetails?.nameOnBank    ?? "") !== form.nameOnBank;
      if (bankChanged) {
        payload.bankDetails = {
          accountNumber: form.accountNumber,
          bankName:      form.bankName,
          nameOnBank:    form.nameOnBank,
        };
      }

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        return;
      }

      const res  = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      setEditing(false);
      setFlash("Saved.");
      setTimeout(() => setFlash(""), 2000);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    setResetting(true);
    setError("");
    setGeneratedPwd("");
    try {
      const res  = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to reset password.");
      setGeneratedPwd(data.password);
      setConfirmReset(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  }

  async function copyPwd() {
    try {
      await navigator.clipboard.writeText(generatedPwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-32 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (loadError || !user || !form) {
    return (
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/users" className="text-[13px] text-slate-400 hover:text-white">← Back to users</Link>
        <div className="mt-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-[14px] text-red-300 font-semibold">{loadError || "User not found."}</p>
        </div>
      </div>
    );
  }

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to users
      </Link>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0">
            {initials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[1.2rem] sm:text-[1.4rem] font-extrabold text-white tracking-tight">{user.name}</h2>
              <Badge
                label={user.isActive ? "Active" : "Suspended"}
                colorClass={user.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}
              />
              {!user.isEmailVerified && (
                <Badge label="Email unverified" colorClass="bg-amber-500/10 text-amber-400 border-amber-500/20" />
              )}
              {user.role === "admin" && (
                <Badge label="Admin" colorClass="bg-violet-500/10 text-violet-400 border-violet-500/20" />
              )}
            </div>
            <p className="text-[12px] text-slate-400 mt-1 break-all">{user.email}</p>
            <p className="text-[11px] font-mono text-slate-600 mt-1">{user.id}</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Link
              href={`/admin/messages?userId=${user.id}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold whitespace-nowrap"
            >
              Message
            </Link>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold whitespace-nowrap"
              >
                Edit details
              </button>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {(error || flash) && (
          <div className="mt-4 grid gap-2">
            {error && <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            {flash && <p className="text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{flash}</p>}
          </div>
        )}
      </motion.div>

      {/* Generated password banner */}
      <AnimatePresence>
        {generatedPwd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">New password</p>
                <p className="text-[14px] text-amber-100 mb-2">Share this with the user securely — it will not be shown again.</p>
                <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-amber-500/30 rounded-xl px-4 py-2.5">
                  <code className="text-[15px] font-mono font-bold text-white tracking-wider select-all break-all">{generatedPwd}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyPwd}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-[12px] font-bold whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => setGeneratedPwd("")}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold whitespace-nowrap"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet + profile + bank */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wallet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Wallet</h3>
          {editing ? (
            <Input label="Balance (₦)" type="number" value={form.walletBalance} onChange={(v) => set("walletBalance", v)} />
          ) : (
            <>
              <p className="text-[1.6rem] font-extrabold text-white">{fmtNGN(user.walletBalance)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Current balance</p>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profile</h3>
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Input label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} />
                <Input label="Last name"  value={form.lastName}  onChange={(v) => set("lastName", v)} />
              </div>
              <Input label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
              <Input label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="08012345678" />
              <div className="pt-2 space-y-2 border-t border-slate-800">
                <Toggle label="Account active"   value={form.isActive}        onChange={(v) => set("isActive", v)} />
                <Toggle label="Email verified"   value={form.isEmailVerified} onChange={(v) => set("isEmailVerified", v)} />
              </div>
            </>
          ) : (
            <>
              <Field label="Phone" value={user.phone} />
              <Field label="Joined" value={fmtDateShort(user.createdAt)} />
              <Field label="Last login" value={fmtDate(user.lastLoginAt)} />
            </>
          )}
        </div>

        {/* Bank */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bank details</h3>
          {editing ? (
            <>
              <Input label="Bank name"      value={form.bankName}      onChange={(v) => set("bankName", v)} />
              <Input label="Account number" value={form.accountNumber} onChange={(v) => set("accountNumber", v)} mono placeholder="10-digit NUBAN" />
              <Input label="Name on bank"   value={form.nameOnBank}    onChange={(v) => set("nameOnBank", v)} />
            </>
          ) : user.bankDetails ? (
            <>
              <Field label="Bank" value={user.bankDetails.bankName} />
              <Field label="Account number" value={<span className="font-mono">{user.bankDetails.accountNumber}</span>} />
              <Field label="Account name" value={user.bankDetails.nameOnBank} />
            </>
          ) : (
            <p className="text-[12px] text-slate-500">No bank details on file.</p>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Security</h3>
            <p className="text-[13px] text-slate-200 mt-1">Reset this user&apos;s password</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Generates a new password, replaces theirs, and shows it once for you to share.</p>
          </div>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[13px] font-semibold whitespace-nowrap"
            >
              Reset password
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 self-start sm:self-auto">
              <button
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={resetPassword}
                disabled={resetting}
                className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Confirm reset"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order counts */}
      {counts && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activity</h3>
            <p className="text-[12px] text-slate-500">{counts.total} total order{counts.total === 1 ? "" : "s"}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile label="Trade"       value={counts.trade}       accent="text-blue-400" />
            <StatTile label="Recovery"    value={counts.recovery}    accent="text-violet-400" />
            <StatTile label="Consignment" value={counts.consignment} accent="text-orange-400" />
            <StatTile label="Editing"     value={counts.editing}     accent="text-pink-400" />
            <StatTile label="Lipsync"     value={counts.lipsync}     accent="text-cyan-400" />
            <StatTile label="Fund"        value={counts.fund}        accent="text-emerald-400" />
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-[15px] font-bold text-white">Recent orders</h3>
          <p className="text-[12px] text-slate-500">Latest {recent.length}</p>
        </div>

        {recent.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] text-slate-500">No orders yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-slate-800">
              {recent.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => router.push(`/admin/orders/${o.id}?type=${o.typeKey}`)}
                    className="w-full text-left p-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge label={o.type} colorClass={TYPE_COLORS[o.type] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      <Badge label={o.status} colorClass={STATUS_COLORS[o.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                    </div>
                    <p className="text-[13px] text-slate-200 line-clamp-1">{o.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-slate-500">{fmtDate(o.date)}</p>
                      <p className="text-[12px] font-semibold text-white">{fmtNGN(o.amount)}</p>
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
                    {["Type", "Description", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o, i) => (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => router.push(`/admin/orders/${o.id}?type=${o.typeKey}`)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={o.type} colorClass={TYPE_COLORS[o.type] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-300 max-w-[280px] truncate">{o.description}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-white whitespace-nowrap">{fmtNGN(o.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={o.status} colorClass={STATUS_COLORS[o.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{fmtDate(o.date)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
