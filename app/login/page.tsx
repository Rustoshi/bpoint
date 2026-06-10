"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AuthPanel from "@/components/AuthPanel";
import Navbar from "@/components/Navbar";

type LoginMethod = "email" | "phone";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  const [method, setMethod] = useState<LoginMethod>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!identifier.trim()) {
      errs.identifier = method === "email" ? "Email address is required" : "Phone number is required";
    } else if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      errs.identifier = "Enter a valid email address";
    } else if (method === "phone" && !/^(\+?234|0)[789][01]\d{8}$/.test(identifier.replace(/\s/g, ""))) {
      errs.identifier = "Enter a valid Nigerian phone number";
    }
    if (!password) errs.password = "Password is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.message ?? "Login failed. Please try again." });
        return;
      }
      // Store access token for client-side use
      if (data.data?.accessToken) {
        sessionStorage.setItem("access_token", data.data.accessToken);
      }
      router.push("/dashboard");
    } catch {
      setErrors({ general: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }

  const switchMethod = (m: LoginMethod) => {
    setMethod(m);
    setIdentifier("");
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:bg-white flex flex-col">
      <Navbar />

      {/* Split layout below navbar */}
      <div className="flex flex-1 lg:flex-row flex-col pt-[68px]">

      {/* ── Left panel: branding (desktop only) ── */}
      <div className="hidden lg:block lg:w-[48%] xl:w-[46%] flex-shrink-0 sticky top-[68px] h-[calc(100vh-68px)]">
        <AuthPanel mode="login" />
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 lg:py-10 bg-slate-50 lg:overflow-y-auto">
        <div className="w-full max-w-[420px]">

        {/* Email verified toast */}
        <AnimatePresence>
          {justVerified && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[13px] text-emerald-700 font-medium">
                Email verified! You can now log in to your account.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-7 pb-5 border-b border-slate-100">
            <h1 className="text-[1.25rem] font-bold text-slate-900 tracking-tight mb-0.5">Welcome back</h1>
            <p className="text-[13px] text-slate-500">Sign in to your BPoint account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">

            {/* Method toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {(["email", "phone"] as LoginMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMethod(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[13px] font-semibold transition-all duration-200
                    ${method === m ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {m === "email" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Phone
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* General error */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[13px] text-red-600 font-medium">{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Identifier field */}
            <AnimatePresence mode="wait">
              <motion.div
                key={method}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-1.5"
              >
                <label htmlFor="identifier" className="text-[13px] font-semibold text-slate-700">
                  {method === "email" ? "Email Address" : "Phone Number"}
                  <span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  id="identifier"
                  type={method === "email" ? "email" : "tel"}
                  placeholder={method === "email" ? "john@example.com" : "08012345678"}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setErrors((err) => ({ ...err, identifier: undefined })); }}
                  className={`w-full h-11 px-3.5 text-[14px] text-slate-900 bg-white border rounded-lg outline-none transition-all duration-150
                    placeholder:text-slate-400
                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.identifier ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                {errors.identifier && (
                  <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.identifier}</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-slate-700">
                  Password<span className="text-red-400 ml-0.5">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((err) => ({ ...err, password: undefined })); }}
                  className={`w-full h-11 px-3.5 pr-11 text-[14px] text-slate-900 bg-white border rounded-lg outline-none transition-all duration-150
                    placeholder:text-slate-400
                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    ${errors.password ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white text-[15px] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-[13px] text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">Create one free</Link>
        </p>

        </div>
      </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
