"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = "profile" | "password" | "bank";

type ProfileForm = { firstName: string; lastName: string; phone: string; email: string };
type PasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };
type BankForm = { accountNumber: string; bankName: string; nameOnBank: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  const token = sessionStorage.getItem("access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-400" };
  if (score <= 3) return { score, label: "Fair", color: "bg-amber-400" };
  if (score === 4) return { score, label: "Good", color: "bg-blue-400" };
  return { score, label: "Strong", color: "bg-emerald-400" };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold text-slate-700">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, disabled, type = "text", error, suffix,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  disabled?: boolean; type?: string; error?: string; suffix?: React.ReactNode;
}) {
  return (
    <div>
      <div className={`flex items-center border rounded-xl overflow-hidden transition-all
        ${error ? "border-red-400 bg-red-50/30" : disabled ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"}`}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3.5 py-2.5 text-[13px] text-slate-800 outline-none bg-transparent disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        {suffix && <div className="pr-3 flex-shrink-0">{suffix}</div>}
      </div>
      {error && <p className="text-[12px] text-red-500 mt-1">⚠ {error}</p>}
    </div>
  );
}

function PasswordInput({
  value, onChange, placeholder, error,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <TextInput
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      suffix={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      }
    />
  );
}

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-medium mb-5
        ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}
    >
      {type === "success" ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {message}
      <button onClick={onDismiss} className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

function SaveButton({ loading, disabled, label = "Save Changes" }: { loading: boolean; disabled?: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
    >
      {loading ? (
        <>
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving...
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState<ProfileForm>({ firstName: "", lastName: "", phone: "", email: "" });
  const [original, setOriginal] = useState<ProfileForm>({ firstName: "", lastName: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Partial<ProfileForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/settings/profile", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setForm(d.profile);
          setOriginal(d.profile);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isDirty = form.firstName !== original.firstName || form.lastName !== original.lastName || form.phone !== original.phone;

  function validate(): boolean {
    const errs: Partial<ProfileForm> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!/^(\+?234|0)[789][01]\d{8}$/.test(form.phone.trim().replace(/\s/g, ""))) errs.phone = "Enter a valid Nigerian phone number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.message ?? "Update failed.", type: "error" }); return; }
      setOriginal({ ...form });
      setToast({ msg: "Profile updated successfully.", type: "success" });
    } catch {
      setToast({ msg: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {[1,2,3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <AnimatePresence mode="wait">
        {toast && <Toast key={toast.msg} message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>First Name</FieldLabel>
          <TextInput value={form.firstName} onChange={(v) => { setForm((f) => ({ ...f, firstName: v })); setErrors((e) => ({ ...e, firstName: "" })); }} placeholder="John" error={errors.firstName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Last Name</FieldLabel>
          <TextInput value={form.lastName} onChange={(v) => { setForm((f) => ({ ...f, lastName: v })); setErrors((e) => ({ ...e, lastName: "" })); }} placeholder="Doe" error={errors.lastName} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Phone Number</FieldLabel>
        <TextInput value={form.phone} onChange={(v) => { setForm((f) => ({ ...f, phone: v })); setErrors((e) => ({ ...e, phone: "" })); }} placeholder="08012345678" error={errors.phone} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <FieldLabel>Email Address</FieldLabel>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Cannot be changed
          </span>
        </div>
        <TextInput value={form.email} disabled placeholder="your@email.com" />
      </div>

      <div className="pt-1">
        <SaveButton loading={saving} disabled={!isDirty} />
      </div>
    </form>
  );
}

// ─── Password tab ──────────────────────────────────────────────────────────────

function PasswordTab() {
  const [form, setForm] = useState<PasswordForm>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const strength = passwordStrength(form.newPassword);

  function validate(): boolean {
    const errs: Partial<PasswordForm> = {};
    if (!form.currentPassword) errs.currentPassword = "Current password is required.";
    if (!form.newPassword) errs.newPassword = "New password is required.";
    else if (form.newPassword.length < 8) errs.newPassword = "Must be at least 8 characters.";
    else if (form.newPassword === form.currentPassword) errs.newPassword = "Must be different from your current password.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your new password.";
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.message ?? "Update failed.", type: "error" }); return; }
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast({ msg: "Password changed successfully.", type: "success" });
    } catch {
      setToast({ msg: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const isDirty = !!(form.currentPassword || form.newPassword || form.confirmPassword);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <AnimatePresence mode="wait">
        {toast && <Toast key={toast.msg} message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Current Password</FieldLabel>
        <PasswordInput value={form.currentPassword} onChange={(v) => { setForm((f) => ({ ...f, currentPassword: v })); setErrors((e) => ({ ...e, currentPassword: "" })); }} placeholder="Enter your current password" error={errors.currentPassword} />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>New Password</FieldLabel>
        <PasswordInput value={form.newPassword} onChange={(v) => { setForm((f) => ({ ...f, newPassword: v })); setErrors((e) => ({ ...e, newPassword: "" })); }} placeholder="At least 8 characters" error={errors.newPassword} />
        {form.newPassword && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-slate-100"}`} />
              ))}
            </div>
            <p className={`text-[11px] font-semibold ${strength.score <= 1 ? "text-red-400" : strength.score <= 3 ? "text-amber-500" : strength.score === 4 ? "text-blue-500" : "text-emerald-500"}`}>
              {strength.label} password
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Confirm New Password</FieldLabel>
        <PasswordInput value={form.confirmPassword} onChange={(v) => { setForm((f) => ({ ...f, confirmPassword: v })); setErrors((e) => ({ ...e, confirmPassword: "" })); }} placeholder="Re-enter new password" error={errors.confirmPassword} />
        {form.confirmPassword && form.newPassword && !errors.confirmPassword && form.newPassword === form.confirmPassword && (
          <p className="text-[12px] text-emerald-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Passwords match
          </p>
        )}
      </div>

      <div className="pt-1">
        <SaveButton loading={saving} disabled={!isDirty} label="Change Password" />
      </div>
    </form>
  );
}

// ─── Bank tab ──────────────────────────────────────────────────────────────────

function BankTab() {
  const [form, setForm] = useState<BankForm>({ accountNumber: "", bankName: "", nameOnBank: "" });
  const [original, setOriginal] = useState<BankForm>({ accountNumber: "", bankName: "", nameOnBank: "" });
  const [errors, setErrors] = useState<Partial<BankForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/settings/bank", { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const b = { accountNumber: d.bankDetails?.accountNumber ?? "", bankName: d.bankDetails?.bankName ?? "", nameOnBank: d.bankDetails?.nameOnBank ?? "" };
          setForm(b); setOriginal(b);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isDirty = form.accountNumber !== original.accountNumber || form.bankName !== original.bankName || form.nameOnBank !== original.nameOnBank;

  function validate(): boolean {
    const errs: Partial<BankForm> = {};
    if (!form.accountNumber.trim()) errs.accountNumber = "Account number is required.";
    else if (!/^\d{10}$/.test(form.accountNumber.trim())) errs.accountNumber = "Account number must be exactly 10 digits.";
    if (!form.bankName.trim()) errs.bankName = "Bank name is required.";
    if (!form.nameOnBank.trim()) errs.nameOnBank = "Name on account is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ accountNumber: form.accountNumber.trim(), bankName: form.bankName.trim(), nameOnBank: form.nameOnBank.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ msg: data.message ?? "Update failed.", type: "error" }); return; }
      setOriginal({ ...form });
      setToast({ msg: "Bank details updated successfully.", type: "success" });
    } catch {
      setToast({ msg: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {[1,2,3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <AnimatePresence mode="wait">
        {toast && <Toast key={toast.msg} message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[13px] text-blue-700">This is the account your gift card trading payouts will be sent to. Make sure the details are correct.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Account Number</FieldLabel>
        <TextInput value={form.accountNumber} onChange={(v) => { if (/^\d*$/.test(v) && v.length <= 10) { setForm((f) => ({ ...f, accountNumber: v })); setErrors((e) => ({ ...e, accountNumber: "" })); } }} placeholder="10-digit account number" error={errors.accountNumber} />
        {form.accountNumber.length > 0 && form.accountNumber.length < 10 && (
          <p className="text-[11px] text-slate-400">{form.accountNumber.length}/10 digits</p>
        )}
        {form.accountNumber.length === 10 && !errors.accountNumber && (
          <p className="text-[11px] text-emerald-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Valid account number
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Bank Name</FieldLabel>
        <TextInput value={form.bankName} onChange={(v) => { setForm((f) => ({ ...f, bankName: v })); setErrors((e) => ({ ...e, bankName: "" })); }} placeholder="e.g. GTBank, First Bank, Access Bank" error={errors.bankName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Name on Account</FieldLabel>
        <TextInput value={form.nameOnBank} onChange={(v) => { setForm((f) => ({ ...f, nameOnBank: v })); setErrors((e) => ({ ...e, nameOnBank: "" })); }} placeholder="Exactly as it appears on your bank account" error={errors.nameOnBank} />
        <p className="text-[11px] text-slate-400">Must match the name registered with your bank exactly.</p>
      </div>

      <div className="pt-1">
        <SaveButton loading={saving} disabled={!isDirty} label="Save Bank Details" />
      </div>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile", label: "Personal Info",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "password", label: "Change Password",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: "bank", label: "Bank Account",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage your personal information, password, and payment details.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all duration-150
              ${activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
        {/* Section heading */}
        <div className="mb-6 pb-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            {TABS.find((t) => t.id === activeTab)?.icon}
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{TABS.find((t) => t.id === activeTab)?.label}</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {activeTab === "profile" && "Update your name and phone number."}
              {activeTab === "password" && "Choose a strong password you don't use elsewhere."}
              {activeTab === "bank" && "The account payouts from gift card trades will be sent to."}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "password" && <PasswordTab />}
            {activeTab === "bank" && <BankTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
