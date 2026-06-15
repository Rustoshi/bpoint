"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbAckKz7j6fxvuPBAM0J";

const options = [
  {
    n: 1,
    title: "Trade your gift card",
    desc: "Send us your gift card on the channel and get paid straight to your bank.",
  },
  {
    n: 2,
    title: "Get live rates & updates",
    desc: "Daily rates, new brands, and service announcements — first, on the channel.",
  },
  {
    n: 3,
    title: "Talk to the admin",
    desc: "Questions about a trade or recovery? Reach the BPoint team directly.",
  },
];

export default function WhatsAppChannel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-slate-100" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="relative rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-2 gap-10 p-8 sm:p-10 lg:p-12 items-center">

            {/* ── Left: copy + CTA ── */}
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[13px] font-semibold mb-5">
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp Channel
              </span>

              <h2 className="text-[1.6rem] sm:text-[2.1rem] font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-3">
                Join our WhatsApp channel
              </h2>
              <p className="text-[15px] text-slate-500 leading-[1.7] mb-7 max-w-[440px]">
                The fastest way to trade your gift cards, follow live rates, and reach the
                BPoint admin team — all in one place.
              </p>

              <motion.a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 text-white text-[15px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Join the channel
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>
            </div>

            {/* ── Right: options ── */}
            <div className="space-y-3">
              {options.map((opt) => (
                <div
                  key={opt.n}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
                >
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white text-[13px] font-extrabold flex items-center justify-center flex-shrink-0">
                    {opt.n}
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900 leading-tight">{opt.title}</p>
                    <p className="text-[13px] text-slate-500 leading-[1.6] mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.989-1.077zm5.382-6.487zm-3.998-5.464c-.182-.405-.374-.413-.547-.42l-.465-.006a.893.893 0 00-.648.305c-.223.243-.85.831-.85 2.027 0 1.196.872 2.352.993 2.514.121.162 1.694 2.715 4.181 3.704 2.067.815 2.488.653 2.936.612.448-.04 1.446-.59 1.65-1.16.205-.572.205-1.062.143-1.165-.061-.103-.223-.165-.466-.286-.243-.122-1.446-.714-1.67-.795-.224-.082-.387-.122-.55.122-.162.243-.631.795-.774.957-.142.163-.285.183-.528.061-.243-.122-1.026-.378-1.954-1.206-.722-.644-1.21-1.439-1.352-1.682-.142-.243-.015-.374.106-.495.109-.108.243-.284.365-.426.121-.142.162-.243.243-.405.081-.163.04-.305-.021-.426-.061-.122-.534-1.318-.752-1.806z" />
    </svg>
  );
}
