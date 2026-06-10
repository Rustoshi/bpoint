"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthPanel from "@/components/AuthPanel";
import Navbar from "@/components/Navbar";

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank Nigeria", "EcoBank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank",
  "Guaranty Trust Bank (GTBank)", "Heritage Bank", "Keystone Bank",
  "Kuda Bank", "Moniepoint MFB", "OPay", "Palmpay", "Parallex Bank",
  "Polaris Bank", "Premium Trust Bank", "Providus Bank", "Stanbic IBTC Bank",
  "Standard Chartered Bank", "Sterling Bank", "SunTrust Bank", "Titan Trust Bank",
  "Union Bank of Nigeria", "United Bank for Africa (UBA)", "Unity Bank",
  "VFD Microfinance Bank", "Wema Bank", "Zenith Bank",
];

type Step = 1 | 2 | 3;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountNumber: string;
  bankName: string;
  nameOnBank: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  accountNumber: "", bankName: "", nameOnBank: "",
  password: "", confirmPassword: "",
};

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-slate-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
              {c.ok ? "✓" : "·"} {c.label}
            </span>
          ))}
        </div>
        <span className={`text-[11px] font-semibold ${score >= 3 ? "text-emerald-600" : "text-slate-400"}`}>
          {labels[score]}
        </span>
      </div>
    </div>
  );
}

function InputField({
  label, name, type = "text", placeholder, value, onChange, error, required, hint, children,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
  required?: boolean; hint?: string; children?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-semibold text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 px-3.5 text-[14px] text-slate-900 bg-white border rounded-lg outline-none transition-all duration-150
            placeholder:text-slate-400
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            ${error ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}
            ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {show ? (
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
        {children}
      </div>
      {error && <p className="text-[12px] text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-[12px] text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  label, name, value, onChange, options, placeholder, error, required,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; error?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-semibold text-slate-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-11 px-3.5 text-[14px] text-slate-900 bg-white border rounded-lg outline-none appearance-none transition-all duration-150
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            ${!value ? "text-slate-400" : ""}
            ${error ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
        >
          <option value="" disabled>{placeholder || "Select..."}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[12px] text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

const STEPS = [
  { num: 1, label: "Personal Info" },
  { num: 2, label: "Bank Details" },
  { num: 3, label: "Set Password" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const clearError = (field: keyof FormData) =>
    setErrors((e) => { const next = { ...e }; delete next[field]; return next; });

  function validateStep(s: Step): Partial<Record<keyof FormData, string>> {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim()) errs.lastName = "Last name is required";
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
      else if (!/^(\+?234|0)[789][01]\d{8}$/.test(form.phone.replace(/\s/g, "")))
        errs.phone = "Enter a valid Nigerian phone number";
    }
    if (s === 2) {
      if (!form.accountNumber.trim()) errs.accountNumber = "Account number is required";
      else if (!/^\d{10}$/.test(form.accountNumber)) errs.accountNumber = "Account number must be 10 digits";
      if (!form.bankName) errs.bankName = "Select your bank";
      if (!form.nameOnBank.trim()) errs.nameOnBank = "Name on bank account is required";
    }
    if (s === 3) {
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
      if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
      else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  }

  function next() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setDir(1);
    setStep((s) => (s + 1) as Step);
  }

  function back() {
    setErrors({});
    setDir(-1);
    setStep((s) => (s - 1) as Step);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep(3);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          accountNumber: form.accountNumber,
          bankName: form.bankName,
          nameOnBank: form.nameOnBank,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ confirmPassword: data.message ?? "Registration failed. Please try again." });
        return;
      }
      router.push(`/login?registered=1&email=${encodeURIComponent(form.email)}`);
    } catch {
      setErrors({ confirmPassword: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 lg:bg-white flex flex-col">
      <Navbar />

      {/* Split layout below navbar */}
      <div className="flex flex-1 lg:flex-row flex-col pt-[68px]">

      {/* ── Left panel: branding (desktop only) ── */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[46%] flex-shrink-0 sticky top-[68px] h-[calc(100vh-68px)]">
        <AuthPanel mode="register" />
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 lg:py-10 bg-slate-50 lg:overflow-y-auto">
        <div className="w-full max-w-[480px]">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-slate-100">
            <h1 className="text-[1.25rem] font-bold text-slate-900 tracking-tight mb-0.5">Create your account</h1>
            <p className="text-[13px] text-slate-500">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>

            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-all duration-300
                    ${step > s.num ? "bg-emerald-500 text-white" : step === s.num ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {step > s.num ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className={`text-[12px] font-medium hidden sm:block ${step === s.num ? "text-slate-700" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 bg-slate-100">
                      <div className={`h-full bg-blue-500 transition-all duration-500 ${step > s.num ? "w-full" : "w-0"}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress + 50}%` }}
              />
            </div>
          </div>

          {/* Form body */}
          <form onSubmit={submit} noValidate>
            <div className="px-7 py-6 overflow-hidden">
              <AnimatePresence custom={dir} mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="First Name" name="firstName" placeholder="John"
                        value={form.firstName} onChange={(v) => { set("firstName")(v); clearError("firstName"); }}
                        error={errors.firstName} required
                      />
                      <InputField
                        label="Last Name" name="lastName" placeholder="Doe"
                        value={form.lastName} onChange={(v) => { set("lastName")(v); clearError("lastName"); }}
                        error={errors.lastName} required
                      />
                    </div>
                    <InputField
                      label="Email Address" name="email" type="email" placeholder="john@example.com"
                      value={form.email} onChange={(v) => { set("email")(v); clearError("email"); }}
                      error={errors.email} required
                    />
                    <InputField
                      label="Phone Number" name="phone" type="tel" placeholder="08012345678"
                      value={form.phone} onChange={(v) => { set("phone")(v); clearError("phone"); }}
                      error={errors.phone} required
                      hint="Nigerian number e.g. 0801 234 5678 or +234..."
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28 }}
                    className="space-y-4"
                  >
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[12px] text-blue-700 leading-relaxed">
                        Your bank account details are used to receive payment when you trade gift cards. Ensure the details are correct.
                      </p>
                    </div>
                    <InputField
                      label="Account Number" name="accountNumber" placeholder="0123456789"
                      value={form.accountNumber}
                      onChange={(v) => { if (/^\d{0,10}$/.test(v)) { set("accountNumber")(v); clearError("accountNumber"); } }}
                      error={errors.accountNumber} required
                      hint="10-digit NUBAN account number"
                    />
                    <SelectField
                      label="Bank Name" name="bankName"
                      value={form.bankName} onChange={(v) => { set("bankName")(v); clearError("bankName"); }}
                      options={NIGERIAN_BANKS} placeholder="Select your bank"
                      error={errors.bankName} required
                    />
                    <InputField
                      label="Name on Bank Account" name="nameOnBank" placeholder="John Doe"
                      value={form.nameOnBank} onChange={(v) => { set("nameOnBank")(v); clearError("nameOnBank"); }}
                      error={errors.nameOnBank} required
                      hint="Must match your bank's registered name exactly"
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.28 }}
                    className="space-y-4"
                  >
                    <div>
                      <InputField
                        label="Password" name="password" type="password" placeholder="Create a strong password"
                        value={form.password} onChange={(v) => { set("password")(v); clearError("password"); }}
                        error={errors.password} required
                      />
                      <PasswordStrength password={form.password} />
                    </div>
                    <InputField
                      label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter your password"
                      value={form.confirmPassword} onChange={(v) => { set("confirmPassword")(v); clearError("confirmPassword"); }}
                      error={errors.confirmPassword} required
                    />

                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Account Summary</p>
                      {[
                        { label: "Name", value: `${form.firstName} ${form.lastName}` },
                        { label: "Email", value: form.email },
                        { label: "Phone", value: form.phone },
                        { label: "Bank", value: form.bankName || "—" },
                        { label: "Account", value: form.accountNumber ? `••••••${form.accountNumber.slice(-4)}` : "—" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="text-[12px] text-slate-400">{row.label}</span>
                          <span className="text-[12px] text-slate-700 font-medium">{row.value}</span>
                        </div>
                      ))}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="px-7 pb-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[14px] text-slate-600 font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-[13px] text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
        </p>

        </div>
      </div>
      </div>
    </div>
  );
}
