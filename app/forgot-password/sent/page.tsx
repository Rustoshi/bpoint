"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const RESEND_COOLDOWN = 60;

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) =>
    a + "*".repeat(Math.max(1, b.length)) + c
  );

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    setResendMsg("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg("A new reset link has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16 pt-[calc(68px+3rem)]">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.07),transparent)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative w-full max-w-[440px]"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-7 py-10 flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-5"
              >
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </motion.div>

              <h1 className="text-[1.2rem] font-bold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-1">
                We sent a password reset link to
              </p>
              <p className="text-[15px] font-semibold text-slate-800 mb-6">
                {maskedEmail || "your email"}
              </p>

              <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 text-left space-y-2 mb-6">
                <p className="text-[12px] font-semibold text-slate-500 mb-2">Helpful tips</p>
                {[
                  "The link expires in 30 minutes",
                  "Check your spam or junk folder",
                  "You can only use the link once",
                ].map((tip) => (
                  <p key={tip} className="text-[12px] text-slate-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>{tip}
                  </p>
                ))}
              </div>

              {/* Resend */}
              <p className="text-[13px] text-slate-500 mb-1">Didn&apos;t receive it?</p>
              <button
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="text-[13px] font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
              >
                {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </button>
              {resendMsg && (
                <p className="text-[12px] text-emerald-600 mt-1">{resendMsg}</p>
              )}
            </div>
          </div>

          <p className="text-center text-[13px] text-slate-500 mt-5">
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              ← Back to login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense>
      <SentContent />
    </Suspense>
  );
}
