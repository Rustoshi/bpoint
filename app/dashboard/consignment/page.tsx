"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { useUser } from "@/lib/hooks/useUser";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  boxDescription: string;
  fee: string;
  date: string;
  status: string;
  proofVideoUrl: string | null;
  adminNote: string | null;
};

// ─── Status badge ──────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Pending:    "text-amber-700 bg-amber-50 border-amber-200",
  Processing: "text-violet-700 bg-violet-50 border-violet-200",
  Delivered:  "text-emerald-700 bg-emerald-50 border-emerald-200",
  Cancelled:  "text-slate-600 bg-slate-50 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  const pulse = status === "Pending" || status === "Processing";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

// ─── Table columns ─────────────────────────────────────────────────────────────

const orderColumns: Column<OrderRow>[] = [
  {
    key: "id", header: "Order ID", width: "w-[100px]",
    searchValue: (r) => r.id,
    render: (r) => <span className="text-[12px] font-mono font-semibold text-slate-500">{r.id}</span>,
  },
  {
    key: "boxDescription", header: "Box Description",
    searchValue: (r) => r.boxDescription,
    render: (r) => (
      <p className="text-[13px] text-slate-700 line-clamp-2 max-w-xs leading-snug">{r.boxDescription}</p>
    ),
  },
  {
    key: "fee", header: "Fee Paid",
    searchValue: (r) => r.fee,
    render: (r) => <span className="text-[13px] font-semibold text-slate-800">{r.fee}</span>,
  },
  {
    key: "date", header: "Date",
    searchValue: (r) => r.date,
    render: (r) => <span className="text-[12px] text-slate-400">{r.date}</span>,
  },
  {
    key: "status", header: "Status",
    searchValue: (r) => r.status,
    render: (r) => (
      <div className="space-y-1.5">
        <StatusBadge status={r.status} />
        {r.adminNote && (
          <p className="text-[11px] text-slate-500 italic line-clamp-1">{r.adminNote}</p>
        )}
      </div>
    ),
  },
  {
    key: "proofVideoUrl", header: "Proof Video",
    searchValue: (r) => r.proofVideoUrl ?? "",
    render: (r) =>
      r.proofVideoUrl ? (
        <a
          href={r.proofVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      ) : (
        <span className="text-[12px] text-slate-300">—</span>
      ),
  },
];

// ─── Section card helper ────────────────────────────────────────────────────────

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-[13px] text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ConsignmentPage() {
  const router = useRouter();
  const { user } = useUser();

  // ── Fee ──
  const [feeNGN, setFeeNGN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/consignment/fee")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFeeNGN(d.feeNGN); })
      .catch(() => setFeeNGN(1000));
  }, []);

  // ── History table ──
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  function loadOrders() {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setTableLoading(false); return; }
    fetch("/api/consignment/my-orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }

  useEffect(() => { loadOrders(); }, []);

  // ── Form state ──
  const [boxDescription, setBoxDescription] = useState("");
  const [videoInstructions, setVideoInstructions] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<{ orderId: string; feeCharged: number } | null>(null);

  const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  function validate() {
    const errs: Record<string, string> = {};
    if (boxDescription.trim().length < 20) errs.boxDescription = "Please describe the box contents in at least 20 characters.";
    if (videoInstructions.trim().length < 10) errs.videoInstructions = "Please provide video instructions of at least 10 characters.";
    if (!agreed) errs.agreed = "Please accept the terms to proceed.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setServerError("");

    if (feeNGN !== null && user && user.walletBalance < feeNGN) {
      setServerError(`Insufficient balance. You need ${fmtNGN(feeNGN)} but your current balance is ${fmtNGN(user.walletBalance)}. Please fund your account first.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/consignment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          boxDescription: boxDescription.trim(),
          videoInstructions: videoInstructions.trim(),
          deliveryAddress: deliveryAddress.trim() || undefined,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message ?? "Submission failed. Please try again.");
        return;
      }
      setSuccess({ orderId: String(data.orderId), feeCharged: data.feeChargedNGN });
      loadOrders();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setBoxDescription(""); setVideoInstructions(""); setDeliveryAddress("");
    setAdditionalNotes(""); setAgreed(false); setErrors({});
    setServerError(""); setSuccess(null);
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Our team will record your consignment box proof video and deliver it to you.</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Order ID: <span className="font-mono font-semibold text-slate-600">{success.orderId}</span>
          </p>

          <div className="w-full p-4 rounded-xl bg-orange-50 border border-orange-100 mb-4 space-y-1">
            <p className="text-[12px] font-semibold text-orange-600 uppercase tracking-wider">Service Fee Charged</p>
            <p className="text-[1.8rem] font-extrabold text-orange-700">{fmtNGN(success.feeCharged)}</p>
            <p className="text-[12px] text-orange-600">Deducted from your wallet balance</p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-100 w-full mb-4">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] text-blue-700">Expected delivery: <strong>24–48 hours</strong></p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 w-full mb-6">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-[13px] text-slate-600">A download link will appear in your <strong>order history</strong> once the video is ready.</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              New Request
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 py-2.5 bg-orange-500 text-white text-[14px] font-semibold rounded-lg hover:bg-orange-600 transition-colors">
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Consignment Box Proof</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Request a proof video of your consignment box. Describe what's inside and how you want it filmed.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Step 1: Box Description */}
            <SectionCard step={1} title="What's in the Box?">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">
                  Box Contents Description <span className="text-red-400">*</span>
                </label>
                <p className="text-[12px] text-slate-400 -mt-0.5">
                  Describe the items inside the box clearly — what they are, quantities, and their condition.
                </p>
                <textarea
                  rows={5}
                  placeholder="e.g. 3 sealed boxes of electronics, 2 clothing items in original packaging, all in new condition..."
                  value={boxDescription}
                  onChange={(e) => { setBoxDescription(e.target.value); setErrors((err) => ({ ...err, boxDescription: "" })); }}
                  className={`w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border rounded-xl outline-none resize-none transition-all leading-relaxed
                    focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                    ${errors.boxDescription ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.boxDescription
                    ? <p className="text-[12px] text-red-500">⚠ {errors.boxDescription}</p>
                    : <span />
                  }
                  <p className={`text-[11px] ${boxDescription.trim().length >= 20 ? "text-emerald-500" : "text-slate-400"}`}>
                    {boxDescription.length} / 20 min
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Step 2: Video Instructions */}
            <SectionCard step={2} title="How Do You Want the Video?">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">
                  Video Instructions <span className="text-red-400">*</span>
                </label>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {[
                    "Show all sides of the box",
                    "Open the box on camera",
                    "Include narration of contents",
                    "Show item labels clearly",
                    "Film in good lighting",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setVideoInstructions((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Show all sides of the box, open it on camera, narrate the contents clearly, film each item label in close-up..."
                  value={videoInstructions}
                  onChange={(e) => { setVideoInstructions(e.target.value); setErrors((err) => ({ ...err, videoInstructions: "" })); }}
                  className={`w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border rounded-xl outline-none resize-none transition-all leading-relaxed
                    focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                    ${errors.videoInstructions ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.videoInstructions
                    ? <p className="text-[12px] text-red-500">⚠ {errors.videoInstructions}</p>
                    : <span />
                  }
                  <p className={`text-[11px] ${videoInstructions.trim().length >= 10 ? "text-emerald-500" : "text-slate-400"}`}>
                    {videoInstructions.length} / 10 min
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Step 3: Optional Details */}
            <SectionCard step={3} title="Additional Details (Optional)">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Delivery / Box Location</label>
                  <p className="text-[12px] text-slate-400 -mt-0.5">Where is the box currently or where is it being delivered to?</p>
                  <input
                    type="text"
                    placeholder="e.g. 245 W 34th St, New York, NY 10001 or shipping to Los Angeles, CA..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full h-10 px-3.5 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Anything Else?</label>
                  <textarea
                    rows={3}
                    placeholder="Any other instructions, context, or special requests for the admin..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none resize-none transition-all leading-relaxed focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>
            </SectionCard>

            {/* Step 4: Terms + Submit */}
            <SectionCard step={4} title="Confirm & Submit">
              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-orange-50 border-orange-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-orange-500 border-orange-500" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I understand the service fee of <strong>{feeNGN !== null ? fmtNGN(feeNGN) : "..."}</strong> will be deducted from my wallet balance upon submission and is non-refundable. A download link for the proof video will be provided in my order history once it is ready.
                  </p>
                </label>
                {errors.agreed && <p className="text-[12px] text-red-500">⚠ {errors.agreed}</p>}

                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200"
                    >
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-[13px] text-red-600 font-medium">{serverError}</p>
                        {serverError.includes("balance") && (
                          <a href="/dashboard/fund" className="text-[12px] text-red-500 underline mt-1 inline-block">Fund your account →</a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-orange-500 text-white text-[15px] font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting request...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Request Proof Video
                      {feeNGN !== null && (
                        <span className="ml-1 text-orange-100 text-[13px] font-normal">· {fmtNGN(feeNGN)} fee</span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Sticky panel ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[13px] font-bold text-slate-700">Order Summary</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Service</span>
                  <span className="text-[13px] font-semibold text-slate-800">Box Proof Video</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Delivery</span>
                  <span className="text-[13px] font-semibold text-slate-800">Download Link</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Service Fee</p>
                  {feeNGN === null ? (
                    <div className="w-24 h-7 bg-slate-100 rounded-lg animate-pulse" />
                  ) : (
                    <p className="text-[1.5rem] font-extrabold text-slate-900 tracking-tight leading-none">
                      {fmtNGN(feeNGN)}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Deducted from wallet on submission</p>
                </div>
                {user && feeNGN !== null && (
                  <div className={`flex items-center gap-2 p-2.5 rounded-lg ${user.walletBalance >= feeNGN ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${user.walletBalance >= feeNGN ? "text-emerald-500" : "text-red-500"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {user.walletBalance >= feeNGN
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    <p className={`text-[11px] font-semibold ${user.walletBalance >= feeNGN ? "text-emerald-700" : "text-red-600"}`}>
                      Balance: {fmtNGN(user.walletBalance)}
                      {user.walletBalance < feeNGN && <> — <a href="/dashboard/fund" className="underline">Fund account</a></>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">How it works</p>
              <InfoRow
                icon={<svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="Submit your request with a clear description of the box and how you want it filmed."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                text="Our team records the proof video according to your instructions within 24–48 hours."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                text="A download link for the video appears in your order history below once it's ready."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="The service fee is non-refundable once submitted."
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── Order History ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-[15px] font-bold text-slate-800">My Consignment Requests</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Download links appear in the Proof Video column once your video is ready
          </p>
        </div>
        <DataTable
          columns={orderColumns}
          data={orders}
          loading={tableLoading}
          rowKey={(r) => r.id}
          pageSize={6}
          searchPlaceholder="Search by ID, description, status..."
          emptyIcon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          emptyTitle="No consignment requests yet"
          emptyDesc="Your proof video requests will appear here with download links once delivered."
        />
      </div>
    </div>
  );
}
