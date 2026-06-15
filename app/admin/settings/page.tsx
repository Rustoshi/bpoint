"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Config = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  dollarToNairaRate: number;
  consignmentFeeNGN: number;
  editingFeeNGN: number;
  lipsyncFeeNGN: number;
  supportEmail: string;
  whatsappNumber: string;
};

type Rate = {
  id: string;
  brand: string;
  slug: string;
  ratePerDollar: number;
  isActive: boolean;
};

type RateDraft = {
  key: string;          // local stable key for React
  id?: string;
  brand: string;
  slug?: string;
  ratePerDollar: string;
  isActive: boolean;
  removed?: boolean;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

// ─── UI bits ───────────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      <header className="mb-4">
        <h3 className="text-[15px] font-bold text-white">{title}</h3>
        {description && <p className="text-[12px] text-slate-500 mt-0.5">{description}</p>}
      </header>
      {children}
    </motion.section>
  );
}

function Input({
  label, value, onChange, type = "text", placeholder, prefix, mono, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; prefix?: string; mono?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[13px] pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-800 border border-slate-700 rounded-xl ${prefix ? "pl-7" : "pl-3"} pr-3 py-2 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 disabled:opacity-50 ${mono ? "font-mono" : ""}`}
        />
      </div>
    </div>
  );
}

function Status({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div className="space-y-2">
      {error && <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-[12px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{success}</p>}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");

  // Bank
  const [bankName, setBankName]   = useState("");
  const [bankAcct, setBankAcct]   = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankErr,    setBankErr]    = useState("");
  const [bankOk,     setBankOk]     = useState("");

  // Dollar rate
  const [dollarRate, setDollarRate] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateErr,    setRateErr]    = useState("");
  const [rateOk,     setRateOk]     = useState("");

  // Service fees
  const [consignmentFee, setConsignmentFee] = useState("");
  const [editingFee,     setEditingFee]     = useState("");
  const [lipsyncFee,     setLipsyncFee]     = useState("");
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesErr,    setFeesErr]    = useState("");
  const [feesOk,     setFeesOk]     = useState("");

  // Giftcard rates
  const [rateDrafts, setRateDrafts] = useState<RateDraft[]>([]);
  const [ratesSaving, setRatesSaving] = useState(false);
  const [ratesErr,    setRatesErr]    = useState("");
  const [ratesOk,     setRatesOk]     = useState("");

  // Public contact info
  const [supportEmail,   setSupportEmail]   = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactErr,    setContactErr]    = useState("");
  const [contactOk,     setContactOk]     = useState("");

  // Admin password
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw,     setNewPw]       = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwErr,    setPwErr]        = useState("");
  const [pwOk,     setPwOk]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch("/api/admin/settings", { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to load settings.");
      const c = data.config as Config;
      setBankName(c.bankName ?? "");
      setBankAcct(c.bankAccountNumber ?? "");
      setBankHolder(c.bankAccountName ?? "");
      setDollarRate(String(c.dollarToNairaRate ?? ""));
      setConsignmentFee(String(c.consignmentFeeNGN ?? ""));
      setEditingFee(String(c.editingFeeNGN ?? ""));
      setLipsyncFee(String(c.lipsyncFeeNGN ?? ""));
      setSupportEmail(c.supportEmail ?? "");
      setWhatsappNumber(c.whatsappNumber ?? "");
      setRateDrafts((data.rates as Rate[]).map((r) => ({
        key:           r.id,
        id:            r.id,
        brand:         r.brand,
        slug:          r.slug,
        ratePerDollar: String(r.ratePerDollar),
        isActive:      r.isActive,
      })));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
    load();
  }, [router, load]);

  function applyConfig(c: Config) {
    setBankName(c.bankName ?? "");
    setBankAcct(c.bankAccountNumber ?? "");
    setBankHolder(c.bankAccountName ?? "");
    setDollarRate(String(c.dollarToNairaRate ?? ""));
    setConsignmentFee(String(c.consignmentFeeNGN ?? ""));
    setEditingFee(String(c.editingFeeNGN ?? ""));
    setLipsyncFee(String(c.lipsyncFeeNGN ?? ""));
    setSupportEmail(c.supportEmail ?? "");
    setWhatsappNumber(c.whatsappNumber ?? "");
  }

  // ── Save contact info ──────────────────────────────────────────────────────
  async function saveContact() {
    setContactSaving(true); setContactErr(""); setContactOk("");
    try {
      const res = await fetch("/api/admin/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          supportEmail:   supportEmail.trim(),
          whatsappNumber: whatsappNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      applyConfig(data.config as Config);
      setContactOk("Contact info updated.");
      setTimeout(() => setContactOk(""), 2500);
    } catch (e) {
      setContactErr(e instanceof Error ? e.message : "Failed to save.");
    } finally { setContactSaving(false); }
  }

  // ── Save bank ─────────────────────────────────────────────────────────────
  async function saveBank() {
    setBankSaving(true); setBankErr(""); setBankOk("");
    try {
      const res = await fetch("/api/admin/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          bankName: bankName.trim(),
          bankAccountNumber: bankAcct.trim(),
          bankAccountName: bankHolder.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      applyConfig(data.config as Config);
      setBankOk("Bank details updated.");
      setTimeout(() => setBankOk(""), 2500);
    } catch (e) {
      setBankErr(e instanceof Error ? e.message : "Failed to save.");
    } finally { setBankSaving(false); }
  }

  // ── Save dollar rate ──────────────────────────────────────────────────────
  async function saveDollarRate() {
    setRateSaving(true); setRateErr(""); setRateOk("");
    try {
      const res = await fetch("/api/admin/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ dollarToNairaRate: Number(dollarRate) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      applyConfig(data.config as Config);
      setRateOk("Exchange rate updated.");
      setTimeout(() => setRateOk(""), 2500);
    } catch (e) {
      setRateErr(e instanceof Error ? e.message : "Failed to save.");
    } finally { setRateSaving(false); }
  }

  // ── Save service fees ─────────────────────────────────────────────────────
  async function saveFees() {
    setFeesSaving(true); setFeesErr(""); setFeesOk("");
    try {
      const res = await fetch("/api/admin/settings/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          consignmentFeeNGN: Number(consignmentFee),
          editingFeeNGN:     Number(editingFee),
          lipsyncFeeNGN:     Number(lipsyncFee),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      applyConfig(data.config as Config);
      setFeesOk("Service prices updated.");
      setTimeout(() => setFeesOk(""), 2500);
    } catch (e) {
      setFeesErr(e instanceof Error ? e.message : "Failed to save.");
    } finally { setFeesSaving(false); }
  }

  // ── Giftcard rates ────────────────────────────────────────────────────────
  function addRateRow() {
    setRateDrafts((d) => [
      ...d,
      { key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, brand: "", ratePerDollar: "1000", isActive: true },
    ]);
  }

  function updateRate(key: string, patch: Partial<RateDraft>) {
    setRateDrafts((d) => d.map((r) => r.key === key ? { ...r, ...patch } : r));
  }

  function removeRate(key: string) {
    setRateDrafts((d) => d.map((r) => r.key === key ? { ...r, removed: true } : r));
  }

  function restoreRate(key: string) {
    setRateDrafts((d) => d.map((r) => r.key === key ? { ...r, removed: false } : r));
  }

  async function saveRates() {
    setRatesSaving(true); setRatesErr(""); setRatesOk("");
    try {
      const payload = rateDrafts.filter((r) => !r.removed).map((r) => ({
        brand:         r.brand.trim(),
        slug:          r.slug,
        ratePerDollar: Number(r.ratePerDollar),
        isActive:      r.isActive,
      }));
      if (payload.some((r) => !r.brand)) throw new Error("Every row needs a brand name.");
      if (payload.some((r) => !Number.isFinite(r.ratePerDollar) || r.ratePerDollar < 1)) {
        throw new Error("Every rate must be at least 1.");
      }
      const res = await fetch("/api/admin/settings/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ rates: payload }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      setRateDrafts((data.rates as Rate[]).map((r) => ({
        key:           r.id,
        id:            r.id,
        brand:         r.brand,
        slug:          r.slug,
        ratePerDollar: String(r.ratePerDollar),
        isActive:      r.isActive,
      })));
      setRatesOk("Gift card rates updated.");
      setTimeout(() => setRatesOk(""), 2500);
    } catch (e) {
      setRatesErr(e instanceof Error ? e.message : "Failed to save.");
    } finally { setRatesSaving(false); }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  async function savePassword() {
    setPwSaving(true); setPwErr(""); setPwOk("");
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to change password.");
      setPwOk("Password changed successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwOk(""), 2500);
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Failed to change password.");
    } finally { setPwSaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-40 bg-slate-800 rounded-2xl animate-pulse" />
        <div className="h-40 bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
        <p className="text-[14px] text-red-300 font-semibold">{loadError}</p>
      </div>
    );
  }

  const visibleRates = rateDrafts;
  const activeCount  = rateDrafts.filter((r) => !r.removed && r.isActive).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[1.3rem] font-extrabold text-white tracking-tight">Settings</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Platform-wide configuration. Changes apply immediately.</p>
      </motion.div>

      {/* ── Payment bank details ── */}
      <SectionCard
        title="Payment bank account"
        description="The account number shown to users when they fund their wallet."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Bank name"      value={bankName}   onChange={setBankName}   placeholder="e.g. GTBank" />
          <Input label="Account number" value={bankAcct}   onChange={setBankAcct}   placeholder="10-digit NUBAN" mono />
          <div className="sm:col-span-2">
            <Input label="Account name" value={bankHolder} onChange={setBankHolder} placeholder="Beneficiary name" />
          </div>
        </div>
        <Status error={bankErr} success={bankOk} />
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveBank}
            disabled={bankSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {bankSaving ? "Saving…" : "Save bank details"}
          </button>
        </div>
      </SectionCard>

      {/* ── Default exchange rate ── */}
      <SectionCard
        title="Default exchange rate"
        description="Fallback ₦ per $1 used when a gift card brand has no specific rate."
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Input
            label="₦ per $1" type="number" value={dollarRate} onChange={setDollarRate} placeholder="e.g. 1500"
          />
          <button
            onClick={saveDollarRate}
            disabled={rateSaving}
            className="h-[38px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {rateSaving ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="mt-3"><Status error={rateErr} success={rateOk} /></div>
      </SectionCard>

      {/* ── Service prices ── */}
      <SectionCard
        title="Service prices"
        description="Fees charged when users place each service request. All values in ₦."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Consignment proof" type="number" prefix="₦" value={consignmentFee} onChange={setConsignmentFee} />
          <Input label="Photo editing"     type="number" prefix="₦" value={editingFee}     onChange={setEditingFee} />
          <Input label="Lipsync video"     type="number" prefix="₦" value={lipsyncFee}     onChange={setLipsyncFee} />
        </div>
        <div className="mt-3"><Status error={feesErr} success={feesOk} /></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            Preview: Consignment {fmtNGN(Number(consignmentFee) || 0)} · Editing {fmtNGN(Number(editingFee) || 0)} · Lipsync {fmtNGN(Number(lipsyncFee) || 0)}
          </p>
          <button
            onClick={saveFees}
            disabled={feesSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {feesSaving ? "Saving…" : "Save prices"}
          </button>
        </div>
      </SectionCard>

      {/* ── Gift card rates ── */}
      <SectionCard
        title="Gift card rates"
        description={`Per-brand ₦/$ rate shown in the trade flow. ${activeCount} active.`}
      >
        <div className="space-y-2">
          {visibleRates.map((r) => (
            <div
              key={r.key}
              className={`flex flex-col sm:grid sm:grid-cols-[1fr_140px_auto_auto] gap-2 sm:items-center p-3 rounded-xl border ${
                r.removed ? "bg-red-500/5 border-red-500/20 opacity-60" : "bg-slate-800/40 border-slate-700/60"
              }`}
            >
              <input
                type="text"
                value={r.brand}
                onChange={(e) => updateRate(r.key, { brand: e.target.value })}
                placeholder="Brand name"
                disabled={r.removed}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[12px] pointer-events-none">₦/$</span>
                <input
                  type="number"
                  value={r.ratePerDollar}
                  onChange={(e) => updateRate(r.key, { ratePerDollar: e.target.value })}
                  placeholder="1000"
                  disabled={r.removed}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-[13px] text-white font-semibold outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none sm:justify-self-center">
                <input
                  type="checkbox"
                  checked={r.isActive}
                  disabled={r.removed}
                  onChange={(e) => updateRate(r.key, { isActive: e.target.checked })}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-[12px] text-slate-300">Active</span>
              </label>
              {r.removed ? (
                <button
                  onClick={() => restoreRate(r.key)}
                  className="text-[12px] font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5"
                >
                  Restore
                </button>
              ) : (
                <button
                  onClick={() => removeRate(r.key)}
                  className="text-[12px] font-semibold text-red-400 hover:text-red-300 px-3 py-1.5"
                  aria-label="Remove brand"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addRateRow}
          className="mt-3 w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 border-dashed text-slate-300 text-[12px] font-semibold inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add brand
        </button>

        <div className="mt-3"><Status error={ratesErr} success={ratesOk} /></div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={saveRates}
            disabled={ratesSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {ratesSaving ? "Saving…" : "Save gift card rates"}
          </button>
        </div>
      </SectionCard>

      {/* ── Public contact info ── */}
      <SectionCard
        title="Public contact info"
        description="Email and WhatsApp number shown on the public site (Contact page, footer, etc.)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Support email"
            type="email"
            value={supportEmail}
            onChange={setSupportEmail}
            placeholder="support@bpoint.pro"
          />
          <Input
            label="WhatsApp number"
            value={whatsappNumber}
            onChange={setWhatsappNumber}
            placeholder="2348012345678"
            mono
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          WhatsApp number must include the country code, digits only (no <code>+</code> or spaces) — e.g. <code>2348012345678</code>.
        </p>
        <div className="mt-3"><Status error={contactErr} success={contactOk} /></div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveContact}
            disabled={contactSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {contactSaving ? "Saving…" : "Save contact info"}
          </button>
        </div>
      </SectionCard>

      {/* ── Admin password ── */}
      <SectionCard
        title="Admin password"
        description="Change your own admin login password."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Current password" type="password" value={currentPw} onChange={setCurrentPw} />
          <Input label="New password"     type="password" value={newPw}     onChange={setNewPw}     placeholder="Min 8 chars" />
          <Input label="Confirm new"      type="password" value={confirmPw} onChange={setConfirmPw} />
        </div>
        <div className="mt-3"><Status error={pwErr} success={pwOk} /></div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={savePassword}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50"
          >
            {pwSaving ? "Saving…" : "Change password"}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
