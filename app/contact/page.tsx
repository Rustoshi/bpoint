import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { loadContactInfo } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact — BPoint",
  description: "Get in touch with the BPoint team — email or WhatsApp.",
};

export const revalidate = 60;

export default async function ContactPage() {
  const contact = await loadContactInfo();

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-14 text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-widest text-blue-600 mb-3">Contact</p>
          <h1 className="text-[1.8rem] sm:text-[2.4rem] font-extrabold text-slate-900 tracking-tight leading-tight">
            Talk to a real human.<br className="hidden sm:block" />
            <span className="text-blue-600"> Usually within minutes.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-4 max-w-xl mx-auto leading-relaxed">
            Pick the channel that fits. WhatsApp is fastest for live questions. Email is best for anything that needs a paper trail.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* WhatsApp */}
          {contact.whatsappNumber ? (
            <a
              href={contact.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">WhatsApp</p>
              <p className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 mt-1 group-hover:text-emerald-700 transition-colors break-all">
                {contact.whatsappPretty}
              </p>
              <p className="text-[12px] text-slate-500 mt-2">Tap to chat — opens WhatsApp.</p>
            </a>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 opacity-70">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp</p>
              <p className="text-[13px] text-slate-500 mt-2">Not configured yet.</p>
            </div>
          )}

          {/* Email */}
          {contact.supportEmail ? (
            <a
              href={`mailto:${contact.supportEmail}`}
              className="group bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">Email</p>
              <p className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 mt-1 group-hover:text-blue-700 transition-colors break-all">
                {contact.supportEmail}
              </p>
              <p className="text-[12px] text-slate-500 mt-2">Tap to compose — most replies within a few hours.</p>
            </a>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 opacity-70">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
              <p className="text-[13px] text-slate-500 mt-2">Not configured yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Hours / response */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 pb-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
          <h2 className="text-[1.05rem] sm:text-[1.15rem] font-extrabold text-slate-900 mb-3">When we&apos;re online</h2>
          <ul className="space-y-2 text-[13.5px] text-slate-600 leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
              <span><strong className="text-slate-900">Monday – Friday:</strong> 9:00 AM – 9:00 PM (WAT)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
              <span><strong className="text-slate-900">Saturday:</strong> 10:00 AM – 6:00 PM (WAT)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
              <span><strong className="text-slate-900">Sunday:</strong> Limited support — emergencies via WhatsApp.</span>
            </li>
          </ul>
          <p className="text-[12px] text-slate-500 mt-4">
            Account holders also get a direct messaging thread inside their dashboard — log in and head to <span className="font-semibold text-slate-700">Messages</span>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 pb-14 sm:pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 sm:p-10 text-center">
          <h3 className="text-[1.2rem] sm:text-[1.5rem] font-extrabold text-white tracking-tight">
            Already a customer?
          </h3>
          <p className="text-[13px] sm:text-[14px] text-blue-100 mt-2 max-w-md mx-auto">
            Log in and use the in-app messaging — it&apos;s the fastest way to reach our team about an order.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white text-blue-600 text-[14px] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Open Messages
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-700/40 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700/60 border border-white/20 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
