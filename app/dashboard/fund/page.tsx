"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { useUser } from "@/lib/hooks/useUser";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ─── Types ─────────────────────────────────────────────────────────────────────

type BankInfo = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

type RequestRow = {
  id: string;
  amount: string;
  date: string;
  status: string;
  adminNote: string | null;
  receiptUrl: string;
};

// ─── Receipt upload helpers ────────────────────────────────────────────────────

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Status badge ──────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Pending:  "text-amber-700 bg-amber-50 border-amber-200",
  Approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rejected: "text-red-600 bg-red-50 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  const pulse = status === "Pending";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

// ─── Table columns ─────────────────────────────────────────────────────────────

const requestColumns: Column<RequestRow>[] = [
  {
    key: "id", header: "Request ID", width: "w-[110px]",
    searchValue: (r) => r.id,
    render: (r) => <span className="text-[12px] font-mono font-semibold text-slate-500">{r.id}</span>,
  },
  {
    key: "amount", header: "Amount",
    searchValue: (r) => r.amount,
    render: (r) => <span className="text-[13px] font-bold text-slate-800">{r.amount}</span>,
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
          <p className="text-[11px] text-slate-500 italic line-clamp-2 max-w-[200px]">{r.adminNote}</p>
        )}
      </div>
    ),
  },
  {
    key: "receiptUrl", header: "Receipt",
    searchValue: () => "",
    render: (r) => (
      <a
        href={r.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-500 hover:text-blue-600 hover:underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View
      </a>
    ),
  },
];

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FundPage() {
  const router = useRouter();
  const { user } = useUser();

  // ── Bank info ──
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/fund/bank-info")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBankInfo(d.bankInfo); })
      .catch(() => {})
      .finally(() => setBankLoading(false));
  }, []);

  function copyAccountNumber() {
    if (!bankInfo) return;
    navigator.clipboard.writeText(bankInfo.accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── History table ──
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  function loadRequests() {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setTableLoading(false); return; }
    fetch("/api/fund/my-requests", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.requests); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }

  useEffect(() => { loadRequests(); }, []);

  // ── Form state ──
  const [amountInput, setAmountInput] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<{ requestId: string; amountNGN: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  useEffect(() => {
    return () => { if (receiptPreview) URL.revokeObjectURL(receiptPreview); };
  }, [receiptPreview]);

  const handleReceiptFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!RECEIPT_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, receipt: "Only JPG, PNG, WEBP, and PDF files are accepted." }));
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setErrors((e) => ({ ...e, receipt: "File size must be under 5 MB." }));
      return;
    }
    setErrors((e) => ({ ...e, receipt: "" }));
    setReceiptFile(file);
    if (file.type !== "application/pdf") {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  }, [receiptPreview]);

  function validate() {
    const errs: Record<string, string> = {};
    const amount = parseFloat(amountInput.replace(/,/g, ""));
    if (!amountInput || isNaN(amount) || amount < 100) errs.amount = "Please enter a valid amount of at least ₦100.";
    if (!receiptFile) errs.receipt = "Please upload your payment receipt.";
    if (!agreed) errs.agreed = "Please confirm your payment details are correct.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setServerError("");
    setSubmitting(true);

    try {
      const token  = sessionStorage.getItem("access_token") ?? "";
      const amount = parseFloat(amountInput.replace(/,/g, ""));

      // 1) Browser-direct Cloudinary upload (does not touch our API).
      setUploadPct(1);
      const asset = await uploadToCloudinary(receiptFile!, {
        folder: "bpoint/fund-receipts",
        onProgress: setUploadPct,
      });

      // 2) Submit the URL.
      const res = await fetch("/api/fund/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amountNGN:  amount,
          receiptUrl: asset.url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message ?? "Submission failed. Please try again.");
        return;
      }
      setSuccess({ requestId: String(data.requestId), amountNGN: data.amountNGN });
      loadRequests();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Upload or submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadPct(0);
    }
  }

  function resetForm() {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setAmountInput(""); setReceiptFile(null); setReceiptPreview(null);
    setAgreed(false); setErrors({}); setServerError(""); setSuccess(null);
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
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Your fund request is now under review.</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Request ID: <span className="font-mono font-semibold text-slate-600">{success.requestId}</span>
          </p>

          <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-4 space-y-1">
            <p className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">Amount Submitted</p>
            <p className="text-[1.8rem] font-extrabold text-emerald-700">{fmtNGN(success.amountNGN)}</p>
            <p className="text-[12px] text-emerald-600">Pending admin verification</p>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 w-full mb-4 text-left">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] text-blue-700">Your wallet will be credited within <strong>1–3 hours</strong> once admin verifies your payment.</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              New Request
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 py-2.5 bg-emerald-500 text-white text-[14px] font-semibold rounded-lg hover:bg-emerald-600 transition-colors">
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Fund Wallet</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Transfer to the account below, then submit your payment details for verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Bank account card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-5">
                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-[13px] font-bold opacity-90 uppercase tracking-wider">Payment Account</p>
              </div>

              {bankLoading ? (
                <div className="space-y-3">
                  <div className="h-6 w-48 bg-white/20 rounded-lg animate-pulse" />
                  <div className="h-8 w-36 bg-white/20 rounded-lg animate-pulse" />
                  <div className="h-5 w-24 bg-white/20 rounded-lg animate-pulse" />
                </div>
              ) : bankInfo ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold opacity-60 uppercase tracking-wider mb-0.5">Account Name</p>
                    <p className="text-[1.1rem] font-extrabold">{bankInfo.accountName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold opacity-60 uppercase tracking-wider mb-0.5">Account Number</p>
                    <div className="flex items-center gap-2.5">
                      <p className="text-[1.6rem] font-extrabold tracking-widest">{bankInfo.accountNumber}</p>
                      <button
                        type="button"
                        onClick={copyAccountNumber}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-[12px] font-bold"
                      >
                        {copied ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold opacity-60 uppercase tracking-wider mb-0.5">Bank</p>
                    <p className="text-[14px] font-bold">{bankInfo.bankName}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] opacity-70">Unable to load bank details. Please refresh the page.</p>
              )}

              <div className="mt-5 pt-4 border-t border-white/20 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[12px] opacity-80 leading-relaxed">
                  Transfer the exact amount you intend to fund, then fill in the details below. Include a screenshot of your transfer receipt.
                </p>
              </div>
            </div>

            {/* Step 1: Amount */}
            <SectionCard step={1} title="How Much Did You Pay?">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">
                  Amount Paid (₦) <span className="text-red-400">*</span>
                </label>
                <div className={`flex items-center border rounded-xl overflow-hidden transition-all
                  ${errors.amount ? "border-red-400 bg-red-50/30" : "border-slate-200 bg-white hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"}`}>
                  <span className="px-4 py-3 text-[14px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200 select-none">₦</span>
                  <input
                    type="number"
                    min={100}
                    step={1}
                    placeholder="e.g. 5000"
                    value={amountInput}
                    onChange={(e) => { setAmountInput(e.target.value); setErrors((err) => ({ ...err, amount: "" })); }}
                    className="flex-1 px-4 py-3 text-[14px] font-semibold text-slate-800 outline-none bg-transparent"
                  />
                </div>
                {errors.amount
                  ? <p className="text-[12px] text-red-500">⚠ {errors.amount}</p>
                  : amountInput && parseFloat(amountInput) >= 100
                    ? <p className="text-[12px] text-emerald-500">= {fmtNGN(parseFloat(amountInput))}</p>
                    : null
                }
              </div>
            </SectionCard>

            {/* Step 2: Receipt Upload */}
            <SectionCard step={2} title="Upload Payment Receipt">
              <div className="space-y-3">
                <p className="text-[12px] text-slate-400">
                  Upload a screenshot or PDF of your bank transfer confirmation. Max 5 MB.
                </p>

                {!receiptFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleReceiptFile(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-all
                      ${dragOver ? "border-emerald-400 bg-emerald-50/60 scale-[1.01]" : errors.receipt ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 bg-slate-50"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-slate-600">Drop receipt here or <span className="text-emerald-500">browse</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP or PDF · Max 5 MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={RECEIPT_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => handleReceiptFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                    {receiptPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={receiptPreview} alt="Receipt preview" className="w-14 h-14 rounded-lg object-cover border border-emerald-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700 truncate">{receiptFile.name}</p>
                      <p className="text-[11px] text-slate-400">{(receiptFile.size / 1024).toFixed(1)} KB · Receipt uploaded</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReceiptFile(null); if (receiptPreview) URL.revokeObjectURL(receiptPreview); setReceiptPreview(null); }}
                      className="w-7 h-7 rounded-full bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {errors.receipt && <p className="text-[12px] text-red-500">⚠ {errors.receipt}</p>}
              </div>
            </SectionCard>

            {/* Step 3: Confirm + Submit */}
            <SectionCard step={3} title="Confirm & Submit">
              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I confirm that I have made the transfer to the account above and that the payment details I've provided are accurate. I understand that submitting false payment claims may result in account suspension.
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
                      <p className="text-[13px] text-red-600 font-medium">{serverError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 text-white text-[15px] font-bold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {uploadPct > 0 && uploadPct < 100 ? `Uploading receipt ${uploadPct}%…` : "Submitting request…"}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Fund Request
                      {amountInput && parseFloat(amountInput) >= 100 && (
                        <span className="ml-1 text-emerald-100 text-[13px] font-normal">· {fmtNGN(parseFloat(amountInput))}</span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Sticky panel ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[13px] font-bold text-slate-700">Request Summary</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Amount</span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {amountInput && parseFloat(amountInput) >= 100 ? fmtNGN(parseFloat(amountInput)) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Receipt</span>
                  <span className="text-[12px] font-semibold text-slate-600">
                    {receiptFile ? "✓ Uploaded" : "—"}
                  </span>
                </div>
                {user && (
                  <div className="border-t border-dashed border-slate-200 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                    <p className="text-[1.2rem] font-extrabold text-slate-900">{fmtNGN(user.walletBalance)}</p>
                    {amountInput && parseFloat(amountInput) >= 100 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                        After approval: {fmtNGN(user.walletBalance + parseFloat(amountInput))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">What happens next</p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <p className="text-[12px] text-slate-600">Make your bank transfer to the account shown above.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <p className="text-[12px] text-slate-600">Submit the amount paid and your transfer receipt.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <p className="text-[12px] text-slate-600">Admin verifies your payment, usually within 1–3 hours.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <p className="text-[12px] text-slate-600">Your wallet balance is credited automatically on approval.</p>
              </div>
              <div className="flex items-start gap-2 mt-1 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[11px] text-amber-700">Only one pending request is allowed at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── History ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-[15px] font-bold text-slate-800">Fund Request History</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Track the status of your wallet funding requests</p>
        </div>
        <DataTable
          columns={requestColumns}
          data={requests}
          loading={tableLoading}
          rowKey={(r) => r.id}
          pageSize={6}
          searchPlaceholder="Search by ID, amount, status..."
          emptyIcon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          emptyTitle="No fund requests yet"
          emptyDesc="Your wallet funding requests will appear here once submitted."
        />
      </div>
    </div>
  );
}
