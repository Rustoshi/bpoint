"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const FU = ({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "$5M+", label: "Total Traded" },
  { value: "99.9%", label: "Success Rate" },
];

const brands = ["Amazon", "iTunes", "Walmart", "Steam", "Google Play", "eBay"];

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-white pt-[68px]">
      {/* Background: hero-bg gift card collage, anchored bottom-right, blurred + faded */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <Image
          src="/hero-bg.webp"
          alt=""
          fill
          className="object-cover object-center scale-110 blur-[2px] opacity-[0.07]"
          priority={false}
          aria-hidden="true"
        />
        {/* Radial fade so edges dissolve cleanly */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_30%_50%,rgba(255,255,255,0.95)_30%,rgba(255,255,255,0.6)_70%,transparent_100%)]" />
      </div>
      {/* Subtle top blue tint */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-5%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-10 sm:py-14 lg:min-h-[calc(70vh-68px)] lg:py-0">

          {/* ── Left: Copy ── */}
          <div className="flex flex-col items-start w-full">

            {/* Badge */}
            <FU delay={0.05} className="mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Trusted Gift Card Exchange
              </span>
            </FU>

            {/* Headline */}
            <FU delay={0.15}>
              <h1 className="text-[1.9rem] sm:text-[2.6rem] lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.12] tracking-tight mb-4 sm:mb-5">
                Trade Gift Cards{" "}
                <span className="text-blue-600">
                  Fast &amp; Securely
                </span>
              </h1>
            </FU>

            {/* Subtext */}
            <FU delay={0.25}>
              <p className="text-[15px] sm:text-[17px] text-slate-500 leading-[1.7] mb-7 max-w-[480px]">
                Upload your gift card, get instant valuation, and receive payment
                straight to your wallet. Recovery, consignment, and editing services also available.
              </p>
            </FU>

            {/* CTAs */}
            <FU delay={0.35} className="flex flex-wrap items-center gap-3 mb-8 sm:mb-10">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[15px] font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Start Trading
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 text-[15px] font-semibold rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  View Rates
                </Link>
              </motion.div>
            </FU>

            {/* Stats row */}
            <FU delay={0.45} className="flex items-center gap-5 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-100 w-full">
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-4 sm:gap-6">
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 leading-none">{s.value}</p>
                    <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 whitespace-nowrap">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="w-px h-7 bg-slate-200" />
                  )}
                </div>
              ))}
            </FU>
          </div>

          {/* ── Right: Hero image + floating card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative hidden lg:flex items-center justify-center overflow-visible"
          >
            {/* Soft glow behind image */}
            <div className="absolute inset-10 bg-blue-100 rounded-3xl blur-3xl opacity-40 -z-10" />

            <Image
              src="/hero.webp"
              alt="Gift card trading illustration"
              width={580}
              height={520}
              className="w-full h-auto object-cover rounded-2xl shadow-2xl shadow-slate-200/80"
              priority
            />

            {/* Floating "Trade Complete" toast */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -bottom-5 -left-6 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 px-4 py-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">Trade Approved</p>
                <p className="text-[12px] text-slate-500">₦82,000 credited to wallet</p>
              </div>
            </motion.div>

            {/* Floating "Rate" badge */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/80 px-4 py-3"
            >
              <p className="text-[12px] text-slate-500 leading-tight">Amazon $100</p>
              <p className="text-[15px] font-bold text-slate-900">Rate: 820/USD</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-emerald-600 font-medium">Live</span>
              </div>
            </motion.div>
          </motion.div>

        </div>

        {/* ── Brand strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="border-t border-slate-100 py-5 sm:py-6 flex flex-wrap items-center gap-2.5 sm:gap-4"
        >
          <span className="text-[13px] text-slate-400 font-medium mr-2">We accept:</span>
          {brands.map((b) => (
            <span
              key={b}
              className="px-3 py-1.5 text-[13px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-full"
            >
              {b}
            </span>
          ))}
          <span className="text-[13px] text-blue-500 font-medium ml-1 cursor-pointer hover:underline">+40 more</span>
        </motion.div>
      </div>
    </section>
  );
}
