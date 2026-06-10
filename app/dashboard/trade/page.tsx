"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

// ─── Brand data (icons are colored initial tiles) ──────────────────────────────

const BRANDS = [
  { slug: "amazon",      name: "Amazon",           color: "bg-amber-500",   accepts: ["ecode", "physical"] },
  { slug: "itunes",      name: "iTunes / Apple",   color: "bg-pink-500",    accepts: ["ecode"] },
  { slug: "google-play", name: "Google Play",      color: "bg-green-500",   accepts: ["ecode"] },
  { slug: "steam",       name: "Steam",            color: "bg-slate-700",   accepts: ["ecode"] },
  { slug: "xbox",        name: "Xbox",             color: "bg-green-600",   accepts: ["ecode"] },
  { slug: "walmart",     name: "Walmart",          color: "bg-blue-600",    accepts: ["ecode", "physical"] },
  { slug: "ebay",        name: "eBay",             color: "bg-yellow-500",  accepts: ["ecode"] },
  { slug: "netflix",     name: "Netflix",          color: "bg-red-600",     accepts: ["ecode"] },
  { slug: "nike",        name: "Nike",             color: "bg-slate-900",   accepts: ["ecode", "physical"] },
  { slug: "sephora",     name: "Sephora",          color: "bg-black",       accepts: ["ecode", "physical"] },
  { slug: "target",      name: "Target",           color: "bg-red-500",     accepts: ["ecode", "physical"] },
  { slug: "best-buy",    name: "Best Buy",         color: "bg-blue-700",    accepts: ["ecode", "physical"] },
  { slug: "visa",        name: "Visa",             color: "bg-blue-800",    accepts: ["physical"] },
  { slug: "mastercard",  name: "Mastercard",       color: "bg-orange-600",  accepts: ["physical"] },
  { slug: "amex",        name: "American Express", color: "bg-cyan-700",    accepts: ["physical"] },
  { slug: "razer-gold",  name: "Razer Gold",       color: "bg-lime-600",    accepts: ["ecode"] },
] as const;

type BrandSlug = (typeof BRANDS)[number]["slug"];

interface RateMap { [slug: string]: number }

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);
}

function BrandIcon({ slug, size = "lg" }: { slug: BrandSlug | null; size?: "sm" | "lg" }) {
  const brand = BRANDS.find((b) => b.slug === slug);
  const sz = size === "lg" ? "w-10 h-10 text-[15px]" : "w-7 h-7 text-[11px]";
  return (
    <div className={`${sz} rounded-xl ${brand?.color ?? "bg-slate-200"} flex items-center justify-center text-white font-extrabold flex-shrink-0`}>
      {brand ? brand.name[0] : "?"}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
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

export default function TradePage() {
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

  // ── Form state ──
  const [selectedSlug, setSelectedSlug] = useState<BrandSlug | null>(null);
  const [cardValue, setCardValue] = useState("");
  const [submissionType, setSubmissionType] = useState<"ecode" | "physical">("ecode");
  const [eCode, setECode] = useState("");
  const [ePin, setEPin] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [success, setSuccess] = useState<{ orderId: string; payoutNGN: number } | null>(null);
  const [serverError, setServerError] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = BRANDS.find((b) => b.slug === selectedSlug) ?? null;
  const currentRate = selectedSlug ? (rates[selectedSlug] ?? 1000) : 1000;
  const valueNum = parseFloat(cardValue) || 0;
  const payoutNGN = valueNum * currentRate;

  // When brand changes, reset submission type if the new brand doesn't support current type
  useEffect(() => {
    if (selectedBrand && !selectedBrand.accepts.includes(submissionType as never)) {
      setSubmissionType(selectedBrand.accepts[0] as "ecode" | "physical");
    }
  }, [selectedSlug, selectedBrand, submissionType]);

  // Revoke old preview URLs on unmount / change
  useEffect(() => {
    return () => { imagePreviews.forEach((url) => URL.revokeObjectURL(url)); };
  }, [imagePreviews]);

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
    if (valid.length === 0) return;
    setImages((prev) => [...prev, ...valid].slice(0, 4));
    setImagePreviews((prev) => {
      const newUrls = valid.map((f) => URL.createObjectURL(f));
      return [...prev, ...newUrls].slice(0, 4);
    });
    setErrors((e) => ({ ...e, images: "" }));
  }, []);

  function removeImage(i: number) {
    URL.revokeObjectURL(imagePreviews[i]);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!selectedSlug) errs.brand = "Please select a gift card brand.";
    if (!cardValue || valueNum < 1) errs.cardValue = "Enter a valid card value (minimum $1).";
    if (valueNum > 10000) errs.cardValue = "Card value cannot exceed $10,000.";
    if (submissionType === "ecode" && !eCode.trim()) errs.eCode = "E-code is required.";
    if (submissionType === "physical" && images.length === 0) errs.images = "Upload at least one card image.";
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
      // 1) Browser-direct Cloudinary upload of card images (physical only).
      let imageUrls: string[] = [];
      if (submissionType === "physical" && images.length > 0) {
        const assets = await uploadManyToCloudinary(images, {
          folder: "bpoint/trade-cards",
          onProgress: (done, total, pct) =>
            setUploadStatus(`Uploading card ${done + (pct === 100 ? 0 : 1)} of ${total}${pct < 100 ? ` (${pct}%)` : ""}…`),
        });
        imageUrls = assets.map((a) => a.url);
      }
      setUploadStatus("");

      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/trade/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          brandSlug: selectedSlug,
          cardValueUSD: valueNum,
          submissionType,
          eCode: submissionType === "ecode" ? eCode.trim() : undefined,
          ePin: ePin.trim() || undefined,
          imageUrls: submissionType === "physical" ? imageUrls : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.message ?? "Submission failed. Please try again."); return; }
      setSuccess({ orderId: String(data.orderId), payoutNGN: data.payoutNGN });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Upload or submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadStatus("");
    }
  }

  const filteredBrands = BRANDS.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

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
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Trade Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Your order has been received.</p>
          <p className="text-[13px] text-slate-400 mb-6">Order ID: <span className="font-mono font-semibold text-slate-600">{success.orderId}</span></p>

          <div className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-100 mb-6 space-y-2">
            <p className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider">Expected Payout</p>
            <p className="text-[2rem] font-extrabold text-emerald-700">{fmtNGN(success.payoutNGN)}</p>
            <p className="text-[12px] text-emerald-600">Will be sent directly to your bank account</p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-100 w-full mb-6">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] text-blue-700">Processing time: <strong>5–15 minutes</strong> during business hours</p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setSuccess(null); setSelectedSlug(null); setCardValue(""); setECode(""); setEPin(""); setImages([]); setImagePreviews([]); setAgreed(false); }}
              className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              New Trade
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Trade Gift Card</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">Sell your gift cards — payout goes straight to your bank account.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT: Form sections ── */}
          <div className="space-y-5">

            {/* Step 1: Brand */}
            <SectionCard step={1} title="Select Gift Card Brand">
              <div className="mb-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 text-[13px] bg-slate-50 border border-slate-200 rounded-lg outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {filteredBrands.map((brand) => {
                  const rate = ratesLoading ? null : (rates[brand.slug] ?? 1000);
                  const isSelected = selectedSlug === brand.slug;
                  return (
                    <button
                      key={brand.slug}
                      type="button"
                      onClick={() => { setSelectedSlug(brand.slug as BrandSlug); setErrors((e) => ({ ...e, brand: "" })); }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150
                        ${isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${brand.color} flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0`}>
                        {brand.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-bold truncate leading-tight ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                          {brand.name}
                        </p>
                        {rate !== null && (
                          <p className="text-[10px] text-slate-400 mt-0.5">₦{rate.toLocaleString()}/$</p>
                        )}
                      </div>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-blue-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
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
              {errors.brand && <p className="mt-2 text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.brand}</p>}
            </SectionCard>

            {/* Step 2: Card value */}
            <SectionCard step={2} title="Card Value">
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
                    className={`w-full h-11 pl-8 pr-4 text-[15px] font-semibold text-slate-900 bg-white border rounded-lg outline-none transition-all
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      ${errors.cardValue ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                  />
                </div>
                {errors.cardValue && <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.cardValue}</p>}
                {valueNum > 0 && selectedSlug && (
                  <p className="text-[12px] text-emerald-600 font-semibold">
                    = {fmtNGN(payoutNGN)} at ₦{currentRate.toLocaleString()}/$
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Step 3: Submission type */}
            <SectionCard step={3} title="How will you submit the card?">
              {/* Toggle */}
              <div className="flex gap-2 mb-5">
                {(["ecode", "physical"] as const).map((type) => {
                  const label = type === "ecode" ? "E-code" : "Scratched Card (Photo)";
                  const disabled = selectedBrand ? !selectedBrand.accepts.includes(type) : false;
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={disabled}
                      onClick={() => { setSubmissionType(type); setErrors((e) => ({ ...e, eCode: "", images: "" })); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all
                        ${submissionType === type
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }
                        ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {type === "ecode" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* E-code fields */}
              {submissionType === "ecode" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">
                      Gift Card Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={eCode}
                      onChange={(e) => { setECode(e.target.value.toUpperCase()); setErrors((err) => ({ ...err, eCode: "" })); }}
                      className={`w-full h-11 px-3.5 font-mono text-[14px] text-slate-900 tracking-widest bg-white border rounded-lg outline-none transition-all
                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        ${errors.eCode ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                    />
                    {errors.eCode && <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.eCode}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">
                      PIN / Security Code <span className="text-[11px] font-normal text-slate-400">(if applicable)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={ePin}
                      onChange={(e) => setEPin(e.target.value)}
                      className="w-full h-11 px-3.5 font-mono text-[14px] text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Photo upload */}
              {submissionType === "physical" && (
                <div className="space-y-3">
                  <p className="text-[13px] text-slate-500">Upload clear photos of the front and back of the card (max 4 images, 5 MB each).</p>
                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleImageAdd(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors
                      ${errors.images ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 bg-slate-50"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-semibold text-slate-600">Drop images here or <span className="text-blue-600">browse</span></p>
                    <p className="text-[11px] text-slate-400">JPG, PNG, WEBP · Max 5 MB each · Up to 4 images</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageAdd(e.target.files)}
                    />
                  </div>
                  {errors.images && <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.images}</p>}
                  {/* Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {imagePreviews.map((url, i) => (
                        <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`card-${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-[12px] text-amber-700 leading-relaxed">Ensure the card number and scratch area are clearly visible. Blurry or cropped images will delay processing.</p>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Step 4: Terms + Submit */}
            <SectionCard step={4} title="Review & Submit">
              <div className="space-y-4">
                {/* Terms */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I confirm that this gift card is genuine, unused, and I am the rightful owner. I understand that payouts are sent to my registered bank account and rates are locked at submission time.
                  </p>
                </label>
                {errors.agreed && <p className="text-[12px] text-red-500 flex items-center gap-1">⚠ {errors.agreed}</p>}

                {/* Server error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200"
                    >
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-[13px] text-red-600 font-medium">{serverError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 text-white text-[15px] font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {uploadStatus || "Submitting trade…"}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Trade
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Sticky summary ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Order summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[13px] font-bold text-slate-700">Order Summary</p>
              </div>
              <div className="p-5 space-y-3">
                {/* Brand row */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-slate-400 font-semibold">Brand</span>
                  {selectedBrand ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${selectedBrand.color} flex items-center justify-center text-white font-bold text-[10px]`}>
                        {selectedBrand.name[0]}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-800">{selectedBrand.name}</span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-slate-400">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Card Value</span>
                  <span className="text-[13px] font-semibold text-slate-800">{valueNum > 0 ? `$${valueNum.toLocaleString()}` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Rate</span>
                  <span className="text-[13px] font-semibold text-slate-800">
                    ₦{currentRate.toLocaleString()} / $1
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Type</span>
                  <span className="text-[13px] font-semibold text-slate-800 capitalize">
                    {submissionType === "ecode" ? "E-code" : "Physical card"}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">You receive</p>
                  <motion.p
                    key={payoutNGN}
                    initial={{ opacity: 0.5, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[1.6rem] font-extrabold text-slate-900 tracking-tight leading-none"
                  >
                    {valueNum > 0 ? fmtNGN(payoutNGN) : "₦0.00"}
                  </motion.p>
                  <p className="text-[11px] text-slate-400 mt-1">Sent directly to your bank account</p>
                </div>
              </div>
            </div>

            {/* Info notices */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Important Info</p>
              <InfoRow
                icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="Processing takes 5–15 minutes during business hours."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                text="Payout goes directly to your registered bank account — no wallet step needed."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                text="The rate shown is locked in at submission time and will not change after you submit."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="Damaged, already-used, or fraudulent cards will be rejected and may lead to account suspension."
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
