"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const FadeUp = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const services = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    label: "Trade Gift Cards",
    color: "blue",
    colorClasses: {
      icon: "bg-blue-50 text-blue-600 border-blue-100",
      tag: "bg-blue-50 text-blue-600",
      bar: "bg-blue-500",
      badge: "bg-blue-600",
    },
    headline: "Instant Gift Card Trading",
    description:
      "Upload your scratch card or e-code in seconds. Our admin team reviews and approves trades fast — typically within minutes. Payment is sent directly to the bank account saved on your profile.",
    steps: ["Upload card details or e-code", "Admin reviews & verifies", "Payment sent to your bank account"],
    meta: { label: "Avg. payout time", value: "< 10 mins" },
    metaNote: "Paid directly to your saved bank account",
    graphic: (
      <div className="w-full space-y-2.5">
        {[
          { brand: "Amazon", amount: "$100", rate: "820", status: "Approved", color: "bg-amber-500" },
          { brand: "iTunes", amount: "$50", rate: "815", status: "Pending", color: "bg-pink-500" },
          { brand: "Steam", amount: "$25", rate: "800", status: "Approved", color: "bg-slate-700" },
        ].map((card) => (
          <div key={card.brand} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-[10px] font-bold">{card.brand[0]}</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">{card.brand} {card.amount}</p>
                <p className="text-[11px] text-slate-400">Rate: ₦{card.rate}/USD</p>
              </div>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              card.status === "Approved"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}>
              {card.status}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    label: "Code Recovery",
    color: "violet",
    colorClasses: {
      icon: "bg-violet-50 text-violet-600 border-violet-100",
      tag: "bg-violet-50 text-violet-600",
      bar: "bg-violet-500",
      badge: "bg-violet-600",
    },
    headline: "Missing Code Recovery",
    description:
      "Lost or scratched-off your gift card code? Upload a clear photo of your card and our specialists will attempt to recover the code using advanced techniques. Pay only on success.",
    steps: ["Upload card photo", "Specialist attempts recovery", "Receive code if recovered"],
    meta: { label: "Recovery success rate", value: "87%" },
    metaNote: "Service fee deducted from your wallet balance",
    graphic: (
      <div className="w-full">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-[11px] text-slate-400 ml-2">code_recovery.exe</span>
          </div>
          <div className="px-4 py-4 space-y-2 font-mono text-[12px]">
            <p className="text-slate-400">{">"} Scanning card image...</p>
            <p className="text-blue-500">{">"} Enhancing resolution...</p>
            <p className="text-violet-500">{">"} Running OCR pass 1/3...</p>
            <p className="text-emerald-500">{">"} Code recovered! ✓</p>
            <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-[11px] text-slate-500 mb-0.5">Recovered code:</p>
              <p className="text-slate-900 font-bold tracking-widest text-[13px]">XXXX-XXXX-XXXX-8472</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: "Consignment Video",
    color: "orange",
    colorClasses: {
      icon: "bg-orange-50 text-orange-600 border-orange-100",
      tag: "bg-orange-50 text-orange-600",
      bar: "bg-orange-500",
      badge: "bg-orange-600",
    },
    headline: "Consignment Box Proof Video",
    description:
      "Need proof of your consignment box contents? Request a professional unboxing video with clear, time-stamped footage. Perfect for high-value trades and dispute resolution.",
    steps: ["Submit box details & location", "Videographer assigned", "Receive timestamped video proof"],
    meta: { label: "Delivery time", value: "24–48 hrs" },
    metaNote: "Service fee deducted from your wallet balance",
    graphic: (
      <div className="w-full">
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200">
          <div className="relative aspect-video bg-slate-800 flex items-center justify-center">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.01)_0px,rgba(255,255,255,0.01)_1px,transparent_1px,transparent_8px)]" />
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white/70 font-medium">REC</span>
            </div>
            <div className="absolute top-2 left-3 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/80">
              00:02:34
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-white font-medium">Box #BP-2847 Unboxing</p>
              <p className="text-[11px] text-slate-400">Timestamped · HD Quality</p>
            </div>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-semibold">Verified</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: "Photo & Doc Editing",
    color: "emerald",
    colorClasses: {
      icon: "bg-emerald-50 text-emerald-600 border-emerald-100",
      tag: "bg-emerald-50 text-emerald-600",
      bar: "bg-emerald-500",
      badge: "bg-emerald-600",
    },
    headline: "Photo & Document Editing",
    description:
      "Professional photo retouching, background removal, document enhancement, and ID card editing. Quick turnaround, pixel-perfect results. Upload once, receive polished files.",
    steps: ["Upload photo or document", "Specify edit requirements", "Receive edited file"],
    meta: { label: "Avg. turnaround", value: "2–6 hrs" },
    metaNote: "Service fee deducted from your wallet balance",
    graphic: (
      <div className="w-full space-y-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[12px] font-semibold text-slate-700">Edit Progress</p>
            <span className="text-[11px] text-emerald-600 font-medium">In progress</span>
          </div>
          {[
            { step: "Background Removal", pct: 100 },
            { step: "Color Correction", pct: 100 },
            { step: "Sharpening & Export", pct: 65 },
          ].map((item) => (
            <div key={item.step} className="mb-2 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-slate-500">{item.step}</span>
                <span className="text-[11px] text-slate-400">{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Formats</p>
            <p className="text-[12px] font-bold text-slate-800">JPG · PNG · PDF</p>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
            <p className="text-[10px] text-slate-400 mb-0.5">Resolution</p>
            <p className="text-[12px] font-bold text-slate-800">Up to 4K</p>
          </div>
        </div>
      </div>
    ),
  },
];

const trustPoints = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Verified & Secure",
    desc: "Every trade is manually reviewed by our expert team before funds are released.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Instant Wallet Credit",
    desc: "Approved trades are credited to your BPoint wallet in real-time, no delays.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Our support team is always on standby to resolve any issues with your trades.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Full Audit Trail",
    desc: "Every transaction is logged and timestamped. Your history is always accessible.",
  },
];

export default function Features() {
  return (
    <section className="relative w-full bg-slate-50 overflow-hidden">
      {/* Top edge decoration */}
      <div className="absolute top-0 inset-x-0 h-px bg-slate-100" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 sm:py-28">

        {/* ── Section header ── */}
        <div className="text-center mb-16 sm:mb-20">
          <FadeUp delay={0}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              What We Offer
            </span>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h2 className="text-[1.8rem] sm:text-[2.4rem] lg:text-[2.8rem] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-4">
              Every service you need,<br className="hidden sm:block" />
              <span className="text-blue-600"> all in one place</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.15}>
            <p className="text-[15px] sm:text-[17px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
              From trading gift cards to recovering missing codes — BPoint handles every step
              professionally, securely, and at admin-configured pricing.
            </p>
          </FadeUp>
        </div>

        {/* ── Service cards ── */}
        <div className="space-y-8 sm:space-y-10">
          {services.map((svc, i) => (
            <FadeUp key={svc.label} delay={i * 0.07}>
              <div className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 grid lg:grid-cols-2 ${
                i % 2 !== 0 ? "lg:[direction:rtl]" : ""
              }`}>
                {/* ── Text side ── */}
                <div className={`p-7 sm:p-10 flex flex-col justify-center ${i % 2 !== 0 ? "lg:[direction:ltr]" : ""}`}>
                  {/* Top row: icon + label */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${svc.colorClasses.icon}`}>
                      {svc.icon}
                    </div>
                    <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${svc.colorClasses.tag}`}>
                      {svc.label}
                    </span>
                  </div>

                  <h3 className="text-[1.3rem] sm:text-[1.55rem] font-bold text-slate-900 leading-snug tracking-tight mb-3">
                    {svc.headline}
                  </h3>
                  <p className="text-[14px] sm:text-[15px] text-slate-500 leading-[1.7] mb-6">
                    {svc.description}
                  </p>

                  {/* Steps */}
                  <ol className="space-y-2.5 mb-7">
                    {svc.steps.map((step, si) => (
                      <li key={step} className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${svc.colorClasses.badge}`}>
                          {si + 1}
                        </span>
                        <span className="text-[14px] text-slate-600 font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Meta stat */}
                  <div className="flex items-center gap-4 pt-5 border-t border-slate-100">
                    <div>
                      <p className="text-[12px] text-slate-400">{svc.meta.label}</p>
                      <p className="text-[18px] font-extrabold text-slate-900 leading-tight">{svc.meta.value}</p>
                    </div>
                    <div className={`h-8 w-1 rounded-full ${svc.colorClasses.bar}`} />
                    <span className="text-[13px] text-slate-500">
                      {svc.metaNote}
                    </span>
                  </div>
                </div>

                {/* ── Graphic side ── */}
                <div className={`relative flex items-center justify-center p-7 sm:p-10 bg-slate-50 border-t lg:border-t-0 border-slate-100 ${
                  i % 2 !== 0 ? "lg:border-r lg:[direction:ltr]" : "lg:border-l"
                }`}>
                  {/* Decorative dot grid */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="relative w-full max-w-sm">
                    {svc.graphic}
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* ── Trust bar ── */}
        <FadeUp delay={0.1} className="mt-20 sm:mt-24">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
            <div className="text-center mb-8">
              <p className="text-[13px] text-slate-400 font-medium uppercase tracking-widest mb-2">Why traders choose BPoint</p>
              <h3 className="text-[1.3rem] sm:text-[1.6rem] font-bold text-slate-900 tracking-tight">
                Built on trust, speed &amp; transparency
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPoints.map((tp, i) => (
                <FadeUp key={tp.title} delay={i * 0.06}>
                  <div className="flex flex-col items-start gap-3 p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors duration-200">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      {tp.icon}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900 mb-1">{tp.title}</p>
                      <p className="text-[13px] text-slate-500 leading-[1.6]">{tp.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* ── Bottom CTA ── */}
        <FadeUp delay={0.1} className="mt-14 text-center">
          <p className="text-[15px] text-slate-500 mb-4">
            Gift card trade payouts go straight to your bank account. Other services are paid from your wallet — <span className="text-slate-700 font-semibold">top up anytime, use instantly.</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 text-white text-[15px] font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create Free Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-slate-700 text-[15px] font-semibold rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              See Pricing
            </a>
          </div>
        </FadeUp>

      </div>
    </section>
  );
}
