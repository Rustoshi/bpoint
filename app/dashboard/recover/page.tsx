"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { uploadManyToCloudinary, uploadToCloudinary } from "@/lib/cloudinary";

// ─── Brand data ────────────────────────────────────────────────────────────────

const BRANDS = [
  { slug: "amazon",      name: "Amazon",           color: "bg-amber-500" },
  { slug: "itunes",      name: "iTunes / Apple",   color: "bg-pink-500" },
  { slug: "google-play", name: "Google Play",      color: "bg-green-500" },
  { slug: "steam",       name: "Steam",            color: "bg-slate-700" },
  { slug: "xbox",        name: "Xbox",             color: "bg-green-600" },
  { slug: "walmart",     name: "Walmart",          color: "bg-blue-600" },
  { slug: "ebay",        name: "eBay",             color: "bg-yellow-500" },
  { slug: "netflix",     name: "Netflix",          color: "bg-red-600" },
  { slug: "nike",        name: "Nike",             color: "bg-slate-900" },
  { slug: "sephora",     name: "Sephora",          color: "bg-black" },
  { slug: "target",      name: "Target",           color: "bg-red-500" },
  { slug: "best-buy",    name: "Best Buy",         color: "bg-blue-700" },
  { slug: "visa",        name: "Visa",             color: "bg-blue-800" },
  { slug: "mastercard",  name: "Mastercard",       color: "bg-orange-600" },
  { slug: "amex",        name: "American Express", color: "bg-cyan-700" },
  { slug: "razer-gold",  name: "Razer Gold",       color: "bg-lime-600" },
] as const;

type BrandSlug = (typeof BRANDS)[number]["slug"];

interface RateMap { [slug: string]: number }

// ─── Issue types ───────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  {
    value: "scratched-off",
    label: "Scratched Off",
    desc: "The scratch area was removed but the code is unreadable or missing",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    value: "missing-code",
    label: "Missing / Never Visible",
    desc: "Card was received or purchased without a visible code",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "damaged-card",
    label: "Damaged Card",
    desc: "The physical card is bent, wet, or otherwise damaged making the code illegible",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    value: "not-loading",
    label: "Code Not Loading",
    desc: "The code is visible but the platform says it's invalid or already redeemed",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    value: "other",
    label: "Other Issue",
    desc: "Something else — describe it in the box below",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
] as const;

type IssueTypeValue = (typeof ISSUE_TYPES)[number]["value"];

// ─── History table types ───────────────────────────────────────────────────────

type RequestRow = {
  id: string;
  brand: string;
  cardValue: string;
  issueType: string;
  rate: string;
  payout: string;
  date: string;
  status: string;
};

const statusStyles: Record<string, string> = {
  Pending:     "text-amber-700 bg-amber-50 border-amber-200",
  Reviewing:   "text-violet-700 bg-violet-50 border-violet-200",
  Approved:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  "Paid out":  "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rejected:    "text-red-700 bg-red-50 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  const pulse = status === "Pending" || status === "Reviewing";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
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

// ─── Table columns ─────────────────────────────────────────────────────────────

const BRAND_COLORS: Record<string, string> = {
  amazon: "bg-amber-500", itunes: "bg-pink-500", "google-play": "bg-green-500",
  steam: "bg-slate-700", xbox: "bg-green-600", walmart: "bg-blue-600",
  ebay: "bg-yellow-500", netflix: "bg-red-600", nike: "bg-slate-900",
  sephora: "bg-black", target: "bg-red-500", "best-buy": "bg-blue-700",
  visa: "bg-blue-800", mastercard: "bg-orange-600", amex: "bg-cyan-700",
  "razer-gold": "bg-lime-600",
};

const requestColumns: Column<RequestRow>[] = [
  {
    key: "brand", header: "Brand", width: "w-[160px]",
    searchValue: (r) => r.brand + r.id,
    render: (r) => {
      const slug = r.brand.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-").replace(/[^a-z0-9-]/g, "");
      const color = BRAND_COLORS[slug] ?? "bg-slate-400";
      return (
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0`}>
            {r.brand[0]}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800">{r.brand}</p>
            <p className="text-[11px] text-slate-400">{r.id}</p>
          </div>
        </div>
      );
    },
  },
  {
    key: "issueType", header: "Issue",
    searchValue: (r) => r.issueType,
    render: (r) => <span className="text-[13px] text-slate-600">{r.issueType}</span>,
  },
  {
    key: "cardValue", header: "Card Value",
    searchValue: (r) => r.cardValue,
    render: (r) => <span className="text-[13px] text-slate-700">{r.cardValue}</span>,
  },
  {
    key: "payout", header: "Payout",
    searchValue: (r) => r.payout,
    render: (r) => <span className="text-[13px] font-semibold text-emerald-700">{r.payout}</span>,
  },
  {
    key: "date", header: "Date",
    searchValue: (r) => r.date,
    render: (r) => <span className="text-[12px] text-slate-400">{r.date}</span>,
  },
  {
    key: "status", header: "Status",
    searchValue: (r) => r.status,
    render: (r) => <StatusBadge status={r.status} />,
  },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function RecoverPage() {
  const router = useRouter();

  // ── Rates ──
  const [rates, setRates] = useState<RateMap>({});
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trade/rates")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const map: RateMap = {};
          for (const r of d.rates) map[r.slug] = r.ratePerDollar;
          setRates(map);
        }
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  // ── History table ──
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  function loadRequests() {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setTableLoading(false); return; }
    fetch("/api/recover/my-requests", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.requests); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }

  useEffect(() => { loadRequests(); }, []);

  // ── Form state ──
  const [selectedSlug, setSelectedSlug] = useState<BrandSlug | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [cardValue, setCardValue] = useState("");
  const [issueType, setIssueType] = useState<IssueTypeValue | null>(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [purchaseStore, setPurchaseStore] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<{ requestId: string; payoutNGN: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = BRANDS.find((b) => b.slug === selectedSlug) ?? null;
  const currentRate = selectedSlug ? (rates[selectedSlug] ?? 1000) : 1000;
  const valueNum = parseFloat(cardValue) || 0;
  const payoutNGN = valueNum * currentRate;
  const filteredBrands = BRANDS.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [imagePreviews, receiptPreview]);

  const handleImageAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const MAX = 5 * 1024 * 1024;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type)) { setErrors((e) => ({ ...e, images: "Only JPG, PNG, WEBP allowed." })); continue; }
      if (f.size > MAX) { setErrors((e) => ({ ...e, images: "Each image must be under 5 MB." })); continue; }
      valid.push(f);
    }
    if (!valid.length) return;
    setImages((prev) => [...prev, ...valid].slice(0, 4));
    setImagePreviews((prev) => {
      const urls = valid.map((f) => URL.createObjectURL(f));
      return [...prev, ...urls].slice(0, 4);
    });
    setErrors((e) => ({ ...e, images: "" }));
  }, []);

  function removeImage(i: number) {
    URL.revokeObjectURL(imagePreviews[i]);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleReceiptAdd(files: FileList | null) {
    if (!files || !files[0]) return;
    const f = files[0];
    if (f.size > 8 * 1024 * 1024) { setErrors((e) => ({ ...e, receipt: "Receipt must be under 8 MB." })); return; }
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
    setErrors((e) => ({ ...e, receipt: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!selectedSlug) errs.brand = "Please select a gift card brand.";
    if (!cardValue || valueNum < 1) errs.cardValue = "Enter a valid card value (minimum $1).";
    if (valueNum > 10000) errs.cardValue = "Card value cannot exceed $10,000.";
    if (!issueType) errs.issueType = "Please select the type of issue.";
    if (issueDescription.trim().length < 10) errs.issueDescription = "Please describe the issue in at least 10 characters.";
    if (images.length === 0) errs.images = "At least one card photo is required.";
    if (!agreed) errs.agreed = "Please accept the terms to proceed.";
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
      // 1) Browser-direct Cloudinary uploads.
      const imageAssets = await uploadManyToCloudinary(images, {
        folder: "bpoint/recovery-cards",
        onProgress: (done, total, pct) =>
          setUploadStatus(`Uploading card ${done + (pct === 100 ? 0 : 1)} of ${total}${pct < 100 ? ` (${pct}%)` : ""}…`),
      });
      let receiptUrl: string | undefined;
      if (receiptFile) {
        setUploadStatus("Uploading receipt…");
        const r = await uploadToCloudinary(receiptFile, {
          folder: "bpoint/recovery-receipts",
          onProgress: (pct) => setUploadStatus(`Uploading receipt ${pct}%…`),
        });
        receiptUrl = r.url;
      }
      setUploadStatus("");

      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/recover/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          brandSlug: selectedSlug,
          brand: selectedBrand?.name ?? selectedSlug,
          cardValueUSD: valueNum,
          issueType,
          issueDescription: issueDescription.trim(),
          imageUrls: imageAssets.map((a) => a.url),
          receiptUrl,
          purchaseStore: purchaseStore.trim() || undefined,
          purchaseDate: purchaseDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message ?? "Submission failed. Please try again.");
        return;
      }
      setSuccess({ requestId: String(data.requestId), payoutNGN: data.payoutNGN });
      loadRequests();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Upload or submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadStatus("");
    }
  }

  function resetForm() {
    setSelectedSlug(null); setBrandSearch(""); setCardValue(""); setIssueType(null);
    setIssueDescription(""); setImages([]); setImagePreviews([]); setReceiptFile(null);
    setReceiptPreview(null); setPurchaseStore(""); setPurchaseDate(""); setAgreed(false);
    setErrors({}); setServerError(""); setSuccess(null);
  }

  // ── Success screen ──
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
            className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Our team will review your card and attempt to recover the code.</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Request ID: <span className="font-mono font-semibold text-slate-600">{success.requestId}</span>
          </p>

          <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-4 space-y-1">
            <p className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">Payout If Recovered</p>
            <p className="text-[1.8rem] font-extrabold text-emerald-700">{fmtNGN(success.payoutNGN)}</p>
            <p className="text-[12px] text-emerald-600">Sent directly to your bank account on successful recovery</p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-100 w-full mb-6">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] text-blue-700">Expected response: <strong>24–72 hours</strong></p>
          </div>

          <p className="text-[13px] text-slate-500 mb-6">
            You can track the status of this request in the history below. No fee is charged — you are only paid if the code is recovered.
          </p>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              New Request
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 py-2.5 bg-violet-600 text-white text-[14px] font-semibold rounded-lg hover:bg-violet-700 transition-colors">
              Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Recover Missing Code</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Submit a card with a missing or unreadable code — if we recover it, the value is paid to your bank account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Step 1: Brand + Value */}
            <SectionCard step={1} title="Gift Card Details">
              <div className="mb-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 mb-5">
                {filteredBrands.map((brand) => {
                  const rate = ratesLoading ? null : (rates[brand.slug] ?? 1000);
                  const isSelected = selectedSlug === brand.slug;
                  return (
                    <button
                      key={brand.slug}
                      type="button"
                      onClick={() => { setSelectedSlug(brand.slug as BrandSlug); setErrors((e) => ({ ...e, brand: "" })); }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150
                        ${isSelected ? "border-violet-500 bg-violet-50 shadow-sm" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"}`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${brand.color} flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0`}>
                        {brand.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-bold truncate leading-tight ${isSelected ? "text-violet-700" : "text-slate-700"}`}>
                          {brand.name}
                        </p>
                        {rate !== null && (
                          <p className="text-[10px] text-slate-400 mt-0.5">₦{rate.toLocaleString()}/$</p>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-violet-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {filteredBrands.length === 0 && (
                  <p className="col-span-full text-[13px] text-slate-400 text-center py-4">No brands match &ldquo;{brandSearch}&rdquo;</p>
                )}
              </div>
              {errors.brand && <p className="mb-3 text-[12px] text-red-500">⚠ {errors.brand}</p>}

              {/* Card value */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">
                  Card Value (USD) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    step="any"
                    placeholder="0.00"
                    value={cardValue}
                    onChange={(e) => { setCardValue(e.target.value); setErrors((err) => ({ ...err, cardValue: "" })); }}
                    className={`w-full h-11 pl-8 pr-4 text-[15px] font-semibold text-slate-900 bg-white border rounded-lg outline-none transition-all focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                      ${errors.cardValue ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                  />
                </div>
                {errors.cardValue && <p className="text-[12px] text-red-500">⚠ {errors.cardValue}</p>}
                {valueNum > 0 && selectedSlug && (
                  <p className="text-[12px] text-emerald-600 font-semibold">
                    Payout if recovered: {fmtNGN(payoutNGN)} at ₦{currentRate.toLocaleString()}/$
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Step 2: Issue type */}
            <SectionCard step={2} title="What is the issue?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ISSUE_TYPES.map((type) => {
                  const isSelected = issueType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => { setIssueType(type.value); setErrors((e) => ({ ...e, issueType: "" })); }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150
                        ${isSelected ? "border-violet-500 bg-violet-50" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {type.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13px] font-bold leading-tight ${isSelected ? "text-violet-700" : "text-slate-700"}`}>{type.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{type.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.issueType && <p className="mt-2 text-[12px] text-red-500">⚠ {errors.issueType}</p>}
            </SectionCard>

            {/* Step 3: Evidence */}
            <SectionCard step={3} title="Upload Evidence">
              <div className="space-y-5">
                {/* Card photos */}
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-slate-700">
                    Card Photos <span className="text-red-400">*</span>
                    <span className="text-[11px] font-normal text-slate-400 ml-1">(front + back, up to 4 images)</span>
                  </p>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleImageAdd(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-7 cursor-pointer transition-colors
                      ${errors.images ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 bg-slate-50"}`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-600">Drop photos or <span className="text-violet-600">browse</span></p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, WEBP · Max 5 MB each</p>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageAdd(e.target.files)} />
                  </div>
                  {errors.images && <p className="text-[12px] text-red-500">⚠ {errors.images}</p>}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`card-${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipt upload */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-slate-700">Purchase Receipt</p>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      Optional — boosts recovery chances
                    </span>
                  </div>
                  {receiptPreview ? (
                    <div className="relative group w-24 aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={receiptPreview} alt="receipt" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { URL.revokeObjectURL(receiptPreview); setReceiptFile(null); setReceiptPreview(null); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => receiptInputRef.current?.click()}
                      className="flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-slate-200 hover:border-violet-400 rounded-xl text-[13px] text-slate-500 hover:text-violet-600 hover:bg-violet-50/30 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Upload receipt photo
                    </button>
                  )}
                  {errors.receipt && <p className="text-[12px] text-red-500">⚠ {errors.receipt}</p>}
                  <input ref={receiptInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleReceiptAdd(e.target.files)} />
                </div>

                {/* Optional purchase details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Where was it purchased?</label>
                    <input
                      type="text"
                      placeholder="e.g. Walmart, Amazon, Jumia..."
                      value={purchaseStore}
                      onChange={(e) => setPurchaseStore(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Approximate purchase date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full h-9 px-3 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Step 4: Description */}
            <SectionCard step={4} title="Describe the Issue">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">
                  Tell us more about what happened <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. The scratch area was removed carefully but the code underneath is completely missing. The card was purchased at Walmart two days ago..."
                  value={issueDescription}
                  onChange={(e) => { setIssueDescription(e.target.value); setErrors((err) => ({ ...err, issueDescription: "" })); }}
                  className={`w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border rounded-xl outline-none resize-none transition-all leading-relaxed
                    focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                    ${errors.issueDescription ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.issueDescription
                    ? <p className="text-[12px] text-red-500">⚠ {errors.issueDescription}</p>
                    : <span />
                  }
                  <p className={`text-[11px] ${issueDescription.length < 10 ? "text-slate-400" : "text-emerald-500"}`}>
                    {issueDescription.length} / 10 min
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Step 5: Terms + Submit */}
            <SectionCard step={5} title="Review & Submit">
              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-violet-50 border-violet-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-violet-600 border-violet-600" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I confirm that this gift card is genuine, was purchased legitimately, and I am the rightful owner.
                    I understand that if the code is recovered the card value is paid to my registered bank account at the rate locked at submission, and that cards which cannot be recovered or are found invalid will be rejected.
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
                        {serverError.toLowerCase().includes("bank details") && (
                          <a href="/dashboard/settings" className="text-[12px] text-red-500 underline mt-1 inline-block">Add bank details →</a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-violet-600 text-white text-[15px] font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {uploadStatus || "Submitting request…"}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Recovery Request
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Sticky summary ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[13px] font-bold text-slate-700">Request Summary</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-400 font-semibold">Brand</span>
                  {selectedBrand ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${selectedBrand.color} flex items-center justify-center text-white font-bold text-[10px]`}>
                        {selectedBrand.name[0]}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">{selectedBrand.name}</span>
                    </div>
                  ) : <span className="text-[13px] text-slate-400">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Card Value</span>
                  <span className="text-[13px] font-semibold text-slate-800">{valueNum > 0 ? `$${valueNum}` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Rate</span>
                  <span className="text-[13px] font-semibold text-slate-800">₦{currentRate.toLocaleString()} / $1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Issue</span>
                  <span className="text-[13px] font-semibold text-slate-800">
                    {issueType ? ISSUE_TYPES.find((t) => t.value === issueType)?.label : "—"}
                  </span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payout if recovered</p>
                  <motion.p
                    key={payoutNGN}
                    initial={{ opacity: 0.5, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[1.6rem] font-extrabold text-slate-900 tracking-tight leading-none"
                  >
                    {valueNum > 0 ? fmtNGN(payoutNGN) : "₦0"}
                  </motion.p>
                  <p className="text-[11px] text-slate-400 mt-1">Sent directly to your bank account</p>
                </div>
              </div>
            </div>

            {/* Info notices */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">How it works</p>
              <InfoRow
                icon={<svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="Our team reviews your request within 24–72 hours."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                text="If recovered, the card value is paid directly to your registered bank account — no fee charged."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                text="Providing a purchase receipt significantly improves recovery success rate."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="The rate is locked at submission. Cards that cannot be recovered or are invalid will be rejected."
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── Request History ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">My Recovery Requests</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">All your past and active recovery requests</p>
          </div>
        </div>
        <DataTable
          columns={requestColumns}
          data={requests}
          loading={tableLoading}
          rowKey={(r) => r.id}
          pageSize={6}
          searchPlaceholder="Search by brand, issue, status..."
          emptyIcon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          emptyTitle="No recovery requests yet"
          emptyDesc="Your submitted recovery requests will appear here."
        />
      </div>
    </div>
  );
}
