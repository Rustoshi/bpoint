import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About — BPoint",
  description: "Nigeria's trusted platform for gift card trading, code recovery, and digital services.",
};

const VALUES = [
  {
    title: "Transparent rates",
    body:  "Every gift card brand has a published ₦/$ rate. What you see at submission is what you get paid — no hidden cuts.",
    icon:  (<path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />),
  },
  {
    title: "Fast payouts",
    body:  "Trades approved during business hours pay out to your registered bank account within 5–15 minutes.",
    icon:  (<path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />),
  },
  {
    title: "Real human support",
    body:  "Our team handles every consignment video, recovery, and edit request personally. You can message us directly from your dashboard.",
    icon:  (<path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />),
  },
  {
    title: "Built for Nigeria",
    body:  "We accept NUBAN accounts from every major Nigerian bank and we settle in naira — no foreign payment processors in between.",
    icon:  (<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />),
  },
];

const STATS = [
  { label: "Gift card brands supported", value: "16+" },
  { label: "Average payout window",      value: "5–15 min" },
  { label: "Naira settled",              value: "₦100M+" },
  { label: "Service categories",         value: "5" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-widest text-blue-600 mb-3">About BPoint</p>
          <h1 className="text-[1.8rem] sm:text-[2.4rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            A Nigerian platform built around<br className="hidden sm:block" />
            <span className="text-blue-600"> a single promise: fair rates, fast payouts.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            We help thousands of Nigerians turn gift cards into naira, recover damaged codes, and request consignment videos, photo edits and lipsync productions — all in one place, all in one wallet.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
          <h2 className="text-[1.1rem] sm:text-[1.3rem] font-extrabold text-slate-900 mb-4">Our story</h2>
          <div className="space-y-4 text-[14px] sm:text-[15px] text-slate-600 leading-relaxed">
            <p>
              BPoint started as a side project to solve a simple frustration: gift card trading in Nigeria was either slow,
              opaque, or scammy. Rates would shift mid-trade. Receipts would get lost. Real support was rare.
            </p>
            <p>
              We rebuilt the experience end-to-end — a clear rate per brand, a locked-in payout the moment you submit,
              a wallet that funds every service, and a single messaging thread to talk to our team.
            </p>
            <p>
              Today, the same platform powers consignment proof videos, photo and document editing,
              lipsync productions, and gift card code recovery. One account, one wallet, one team.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-10 sm:pb-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-center">
              <p className="text-[1.4rem] sm:text-[1.8rem] font-extrabold text-blue-600 tracking-tight">{s.value}</p>
              <p className="text-[11.5px] sm:text-[12px] text-slate-500 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-12 sm:pb-16">
        <h2 className="text-[1.1rem] sm:text-[1.3rem] font-extrabold text-slate-900 mb-5">What we stand on</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{v.icon}</svg>
              </div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-900">{v.title}</h3>
              <p className="text-[12.5px] sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-14 sm:pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 sm:p-10 text-center">
          <h3 className="text-[1.2rem] sm:text-[1.5rem] font-extrabold text-white tracking-tight">
            Ready to start?
          </h3>
          <p className="text-[13px] sm:text-[14px] text-blue-100 mt-2 max-w-md mx-auto">
            Create a free account and trade your first gift card in under a minute.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white text-blue-600 text-[14px] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-700/40 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700/60 border border-white/20 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
