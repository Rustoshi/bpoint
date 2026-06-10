"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10K+", label: "Active traders" },
  { value: "$5M+", label: "Total traded" },
  { value: "99.9%", label: "Success rate" },
];

const testimonials = [
  {
    quote: "Traded my Amazon card in under 5 minutes. Payment hit my account instantly. Best platform I've used.",
    name: "Chisom A.",
    handle: "@chisom_trades",
    avatar: "CA",
    color: "bg-blue-500",
  },
  {
    quote: "The code recovery service is insane. Thought I lost ₦40k, BPoint recovered it within the hour.",
    name: "Tunde O.",
    handle: "@tunde_wealth",
    avatar: "TO",
    color: "bg-violet-500",
  },
];

const brands = ["Amazon", "iTunes", "Steam", "Walmart", "eBay", "Xbox", "Google Play", "Netflix"];

interface AuthPanelProps {
  mode: "login" | "register";
}

export default function AuthPanel({ mode }: AuthPanelProps) {
  const headline =
    mode === "login"
      ? "Trade gift cards at the best rates"
      : "Join 10,000+ traders already on BPoint";
  const sub =
    mode === "login"
      ? "Log in and continue trading. Fast approvals, instant bank payouts, zero hassle."
      : "Create your free account in under 2 minutes and start trading today.";

  return (
    <div className="relative h-full min-h-0 flex flex-col justify-between overflow-hidden bg-slate-900 px-10 py-12">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgba(139,92,246,0.12),transparent)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,#ffffff_0px,#ffffff_1px,transparent_1px,transparent_12px)]" />

      {/* Spacer — navbar sits above, no logo needed here */}
      <div className="relative z-10" />

      {/* Middle: Headline + stats + card mockup */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-[1.75rem] xl:text-[2rem] font-extrabold text-white leading-[1.15] tracking-tight mb-3">
            {headline}
          </h2>
          <p className="text-[14px] text-slate-400 leading-relaxed max-w-[340px] mb-8">
            {sub}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-6 mb-10"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              <div>
                <p className="text-[1.2rem] font-extrabold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
              {i < stats.length - 1 && <div className="w-px h-7 bg-slate-700" />}
            </div>
          ))}
        </motion.div>

        {/* Floating trade card UI mockup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="w-full max-w-[340px] space-y-2.5"
        >
          {/* Card 1 — approved */}
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">A</div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">Amazon $200</p>
                <p className="text-[11px] text-slate-400">Rate: ₦820/USD</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Approved</span>
              <p className="text-[11px] text-slate-400">₦164,000</p>
            </div>
          </div>

          {/* Card 2 — processing */}
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">i</div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">iTunes $100</p>
                <p className="text-[11px] text-slate-400">Rate: ₦815/USD</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Reviewing
              </span>
              <p className="text-[11px] text-slate-400">₦81,500</p>
            </div>
          </div>

          {/* Card 3 — payout sent */}
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-600 flex items-center justify-center text-white font-bold text-[12px] flex-shrink-0">S</div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">Steam $50</p>
                <p className="text-[11px] text-slate-400">Rate: ₦800/USD</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Paid out</span>
              <p className="text-[11px] text-slate-400">₦40,000</p>
            </div>
          </div>

          {/* Brands accepted */}
          <div className="pt-3 flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <span key={b} className="text-[11px] text-slate-500 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom: Testimonial */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10"
      >
        <div className="border-t border-white/[0.07] pt-7 space-y-5">
          {testimonials.map((t) => (
            <div key={t.name} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                {t.avatar}
              </div>
              <div>
                <p className="text-[13px] text-slate-300 leading-relaxed mb-1">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-[11px] text-slate-500">
                  <span className="text-slate-300 font-semibold">{t.name}</span> · {t.handle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
