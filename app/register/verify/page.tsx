"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const char = value.slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    setError("");
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = useCallback(async (code?: string) => {
    const value = code ?? otp.join("");
    if (value.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid code. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
      setVerified(true);
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/login?verified=1");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [otp, router]);

  // Auto-submit when all digits entered
  useEffect(() => {
    if (otp.every((d) => d !== "") && !loading && !verified) {
      handleVerify(otp.join(""));
    }
  }, [otp, loading, verified, handleVerify]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Failed to resend code. Please try again.");
        return;
      }
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(1, b.length)) + c);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.07),transparent)] pointer-events-none" />

      <div className="relative w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-[22px] font-bold text-slate-900 tracking-tight">BPoint</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Success state */}
          {verified ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-8 py-12 flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5"
              >
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="text-[1.25rem] font-bold text-slate-900 mb-2">Email Verified!</h2>
              <p className="text-[14px] text-slate-500 mb-1">Your account has been verified successfully.</p>
              <p className="text-[13px] text-slate-400">Redirecting you to login...</p>
              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="px-7 pt-7 pb-5 border-b border-slate-100 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-[1.15rem] font-bold text-slate-900 mb-1">Check your email</h1>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-[14px] font-semibold text-slate-800 mt-0.5">{maskedEmail || "your email"}</p>
              </div>

              {/* OTP Input */}
              <div className="px-7 py-7">
                <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-4 text-center">
                  Enter verification code
                </label>

                <div className="flex items-center justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading || verified}
                      className={`w-11 h-13 h-[52px] sm:w-12 sm:h-[56px] text-center text-[1.3rem] font-bold border-2 rounded-xl outline-none transition-all duration-150
                        ${digit ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-900"}
                        ${error ? "border-red-400 bg-red-50" : ""}
                        focus:border-blue-500 focus:bg-blue-50/60 focus:ring-2 focus:ring-blue-500/20
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-[13px] text-red-500 text-center flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </motion.p>
                )}

                {/* Loading state */}
                {loading && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-blue-500">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying...
                  </div>
                )}

                {/* Manual submit */}
                {!loading && (
                  <button
                    type="button"
                    onClick={() => handleVerify()}
                    disabled={otp.some((d) => !d) || loading}
                    className="mt-5 w-full py-3 bg-blue-600 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Verify Email
                  </button>
                )}

                {/* Resend */}
                <div className="mt-5 text-center">
                  <p className="text-[13px] text-slate-500 mb-1">Didn&apos;t receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resending}
                    className="text-[13px] font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                  >
                    {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>

                {/* Hints */}
                <div className="mt-6 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <p className="text-[12px] font-semibold text-slate-500 mb-2">Helpful tips</p>
                  {[
                    "Check your spam or junk folder",
                    "The code expires in 10 minutes",
                    "Make sure the email address is correct",
                  ].map((tip) => (
                    <p key={tip} className="text-[12px] text-slate-400 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>{tip}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[13px] text-slate-500 mt-5">
          Wrong email?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">Go back to register</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
