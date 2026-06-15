import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";

export const metadata: Metadata = {
  title: "Services — BPoint",
  description: "Everything BPoint offers: gift card trading, code recovery, consignment videos, photo editing, and lipsync productions.",
};

// Pick up admin fee changes within a minute.
export const revalidate = 60;

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

async function loadFees() {
  await connectDB();
  const c = await getSiteConfig();
  return {
    consignment: Number(c.consignmentFeeNGN ?? 0),
    editing:     Number(c.editingFeeNGN     ?? 0),
    lipsync:     Number(c.lipsyncFeeNGN     ?? 0),
  };
}

type Service = {
  title:       string;
  tagline:     string;
  description: string;
  bullets:     string[];
  cta:         { label: string; href: string };
  feeLabel:    string;
  feeValue:    string;
  accent:      string;
  iconPath:    React.ReactNode;
};

export default async function ServicesPage() {
  const fees = await loadFees();

  const SERVICES: Service[] = [
    {
      title: "Gift Card Trading",
      tagline: "Turn your gift cards into naira, locked at today's rate.",
      description:
        "Submit your gift card by e-code or upload clear photos of a physical card. We verify, lock the rate at the moment of submission, and pay out to your registered bank account within minutes.",
      bullets: [
        "Live ₦/$ rate per brand",
        "Pays out to your registered NUBAN",
        "Typical payout: 5–15 minutes",
        "Supports e-code and physical cards",
      ],
      cta:      { label: "View live rates", href: "/pricing" },
      feeLabel: "Trading fee",
      feeValue: "0% — rate already includes our margin",
      accent:   "from-blue-500 to-cyan-500",
      iconPath: (<path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />),
    },
    {
      title: "Code Recovery",
      tagline: "Damaged, scratched-off, or unreadable code? We'll try to recover it.",
      description:
        "Upload a photo of the card and any purchase receipt you have. Our team works with brand support channels to recover damaged or missing codes — a service that's almost impossible to get individually.",
      bullets: [
        "Submit images + receipt",
        "No upfront fee — you only get paid if we recover it",
        "Recovered value paid straight to your bank account",
        "Rate locked at submission, just like trading",
      ],
      cta:      { label: "Start a recovery", href: "/login" },
      feeLabel: "If recovered",
      feeValue: "Full card value paid out",
      accent:   "from-violet-500 to-purple-500",
      iconPath: (<path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />),
    },
    {
      title: "Consignment Video",
      tagline: "Verifiable proof videos for your card stock or shipments.",
      description:
        "Describe the box and the shot list and we'll record a clear, timestamped consignment video you can share with your buyer or your customs broker. Optional delivery address handling.",
      bullets: [
        "Custom shot list per request",
        "High-resolution shareable video link",
        "Optional pickup / delivery handling",
        "Turnaround within 24 hours on most jobs",
      ],
      cta:      { label: "Request a video", href: "/login" },
      feeLabel: "Per request",
      feeValue: fmtNGN(fees.consignment),
      accent:   "from-orange-500 to-amber-500",
      iconPath: (<path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />),
    },
    {
      title: "Photo & Doc Editing",
      tagline: "Retouching, doc cleanup, and quick design edits.",
      description:
        "Upload your files (images or documents), describe what you need, and our team handles the rest. Common asks: passport-style retouching, receipt cleanup, doc re-typing, and brand-asset edits.",
      bullets: [
        "Up to 10 files per request",
        "Returned as a downloadable link",
        "Most jobs delivered within hours",
        "Flat fee — no per-file surprises",
      ],
      cta:      { label: "Start an edit", href: "/login" },
      feeLabel: "Per request",
      feeValue: fmtNGN(fees.editing),
      accent:   "from-pink-500 to-rose-500",
      iconPath: (<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />),
    },
    {
      title: "Lipsync Video",
      tagline: "Custom lipsync productions, voiceovers included.",
      description:
        "Send us your brief, a reference clip, and any source files (video, audio, images). We produce a polished lipsync video matched to your script and tone.",
      bullets: [
        "Source files: video, audio, image",
        "Custom script + voiceover support",
        "Delivered as a high-res video URL",
        "Revision rounds on every order",
      ],
      cta:      { label: "Brief us", href: "/login" },
      feeLabel: "Per request",
      feeValue: fmtNGN(fees.lipsync),
      accent:   "from-cyan-500 to-teal-500",
      iconPath: (<path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-widest text-blue-600 mb-3">Services</p>
          <h1 className="text-[1.8rem] sm:text-[2.4rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Five services. One wallet.<br className="hidden sm:block" />
            <span className="text-blue-600"> Zero surprises.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
            Everything below runs off the same balance. Top up your wallet once, then spend it on any of these as you need them.
          </p>
        </div>
      </section>

      {/* Services list */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-12 sm:pb-16 space-y-5">
        {SERVICES.map((s) => (
          <article
            key={s.title}
            className="relative bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 overflow-hidden"
          >
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${s.accent}`} />
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{s.iconPath}</svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="text-[16px] sm:text-[18px] font-extrabold text-slate-900">{s.title}</h2>
                    <p className="text-[13px] text-slate-500 mt-0.5">{s.tagline}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 self-start">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{s.feeLabel}</p>
                    <p className="text-[14px] font-extrabold text-slate-900">{s.feeValue}</p>
                  </div>
                </div>
                <p className="text-[13.5px] text-slate-600 mt-3 leading-relaxed">{s.description}</p>
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Link
                    href={s.cta.href}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {s.cta.label}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-14 sm:pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 sm:p-10 text-center">
          <h3 className="text-[1.2rem] sm:text-[1.5rem] font-extrabold text-white tracking-tight">
            Get started today
          </h3>
          <p className="text-[13px] sm:text-[14px] text-blue-100 mt-2 max-w-md mx-auto">
            Create a free account and access every service in seconds.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white text-blue-600 text-[14px] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-700/40 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700/60 border border-white/20 transition-colors"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
