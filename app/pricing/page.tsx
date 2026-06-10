import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";
import GiftCardRate from "@/lib/models/GiftCardRate";

export const metadata: Metadata = {
  title: "Pricing — BPoint",
  description: "Transparent gift card exchange rates and service fees on BPoint.",
};

// Re-render at most every minute so admin rate changes show up quickly.
export const revalidate = 60;

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

type Rate = { brand: string; slug: string; ratePerDollar: number };

async function loadPricing(): Promise<{
  fees: { recovery: number; consignment: number; editing: number; lipsync: number };
  dollarToNairaRate: number;
  rates: Rate[];
}> {
  await connectDB();
  const config = await getSiteConfig();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await GiftCardRate.find({ isActive: true }).sort({ brand: 1 }).lean() as any[];

  return {
    fees: {
      recovery:    Number(config.recoveryFeeNGN    ?? 0),
      consignment: Number(config.consignmentFeeNGN ?? 0),
      editing:     Number(config.editingFeeNGN     ?? 0),
      lipsync:     Number(config.lipsyncFeeNGN     ?? 0),
    },
    dollarToNairaRate: Number(config.dollarToNairaRate ?? 0),
    rates: raw.map((r) => ({
      brand:         r.brand,
      slug:          r.slug,
      ratePerDollar: r.ratePerDollar,
    })),
  };
}

// ─── UI bits ───────────────────────────────────────────────────────────────────

function ServiceCard({
  title, description, price, accent, icon,
}: {
  title: string; description: string; price: number; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
      <div className={`absolute top-0 inset-x-0 h-[3px] rounded-t-2xl bg-gradient-to-r ${accent}`} />
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
          <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">{description}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-[1.6rem] font-extrabold text-slate-900 tracking-tight">{fmtNGN(price)}</span>
            <span className="text-[11px] text-slate-500">/ request</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const { fees, dollarToNairaRate, rates } = await loadPricing();

  const services = [
    {
      title: "Code Recovery",
      description: "Recover damaged, scratched-off, or missing gift card codes.",
      price: fees.recovery,
      accent: "from-violet-500 to-purple-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      title: "Consignment Video",
      description: "We record verifiable proof videos to confirm your card stock.",
      price: fees.consignment,
      accent: "from-orange-500 to-amber-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Photo & Doc Editing",
      description: "Professional retouching and document edits, fast turnaround.",
      price: fees.editing,
      accent: "from-pink-500 to-rose-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      title: "Lipsync Video",
      description: "Custom lipsync videos to your brief — voiceovers and visuals included.",
      price: fees.lipsync,
      accent: "from-cyan-500 to-teal-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-widest text-blue-600 mb-3">Pricing</p>
          <h1 className="text-[1.8rem] sm:text-[2.4rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Transparent rates.<br className="sm:hidden" />
            <span className="text-blue-600"> No surprises.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-3 max-w-xl mx-auto leading-relaxed">
            Live exchange rates and fixed service fees. What you see here is exactly what you get on checkout.
          </p>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-[1.1rem] sm:text-[1.3rem] font-extrabold text-slate-900">Service fees</h2>
            <p className="text-[12.5px] text-slate-500 mt-0.5">Flat fees per request — paid from your wallet.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </section>

      {/* ── Gift card rates ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <header className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-[1.1rem] sm:text-[1.3rem] font-extrabold text-slate-900">Gift card exchange rates</h2>
              <p className="text-[12.5px] text-slate-500 mt-0.5">Rates apply per $1 of card value. Updated by our team.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 self-start sm:self-auto">
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Default rate</p>
              <p className="text-[18px] font-extrabold text-blue-900 leading-tight">
                {fmtNGN(dollarToNairaRate)}<span className="text-[12px] font-semibold text-blue-700"> / $1</span>
              </p>
            </div>
          </header>

          {rates.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[14px] text-slate-500 font-semibold">Rates are being updated. Check back shortly.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards (< sm) */}
              <ul className="sm:hidden divide-y divide-slate-200">
                {rates.map((r) => (
                  <li key={r.slug} className="p-4 flex items-center justify-between gap-3">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{r.brand}</p>
                    <p className="text-[14px] font-extrabold text-slate-900 whitespace-nowrap">
                      {fmtNGN(r.ratePerDollar)}<span className="text-[11px] text-slate-500 font-semibold"> / $1</span>
                    </p>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Brand</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Rate</th>
                      <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Example: $100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((r) => (
                      <tr key={r.slug} className="border-t border-slate-200 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 text-[14px] font-semibold text-slate-900">{r.brand}</td>
                        <td className="px-5 py-3 text-[14px] font-extrabold text-slate-900 text-right whitespace-nowrap">
                          {fmtNGN(r.ratePerDollar)} <span className="text-[11px] text-slate-500 font-semibold">/ $1</span>
                        </td>
                        <td className="px-5 py-3 text-[13.5px] text-slate-600 text-right whitespace-nowrap">
                          {fmtNGN(r.ratePerDollar * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <p className="text-[12px] text-slate-500 mt-3 px-1">
          Rates may change at any time without prior notice. The rate locked in for your trade is the rate shown at the moment you submit.
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-14 sm:pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 sm:p-10 text-center">
          <h3 className="text-[1.2rem] sm:text-[1.5rem] font-extrabold text-white tracking-tight">
            Ready to trade at today&apos;s rate?
          </h3>
          <p className="text-[13px] sm:text-[14px] text-blue-100 mt-2 max-w-md mx-auto">
            Create a free account in under a minute and lock in your payout instantly.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white text-blue-600 text-[14px] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create Free Account
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-700/40 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700/60 border border-white/20 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
