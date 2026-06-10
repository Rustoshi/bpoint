"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { useUser } from "@/lib/hooks/useUser";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

// ─── File helpers ──────────────────────────────────────────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const ACCEPTED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 10;

type UploadedFile = {
  file: File;
  preview: string | null;
  type: "image" | "document";
};

function getFileType(f: File): "image" | "document" {
  return IMAGE_TYPES.includes(f.type) ? "image" : "document";
}

function getFileIcon(mime: string) {
  if (mime === "application/pdf") {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  if (mime.includes("word") || mime === "text/plain") {
    return (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Table types ───────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  editDescription: string;
  filesCount: number;
  fee: string;
  date: string;
  status: string;
  deliveryUrl: string | null;
  adminNote: string | null;
};

const statusStyles: Record<string, string> = {
  Pending:     "text-amber-700 bg-amber-50 border-amber-200",
  "In Progress": "text-violet-700 bg-violet-50 border-violet-200",
  Delivered:   "text-emerald-700 bg-emerald-50 border-emerald-200",
  Cancelled:   "text-slate-600 bg-slate-50 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
  const pulse = status === "Pending" || status === "In Progress";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

const orderColumns: Column<OrderRow>[] = [
  {
    key: "id", header: "Order ID", width: "w-[100px]",
    searchValue: (r) => r.id,
    render: (r) => <span className="text-[12px] font-mono font-semibold text-slate-500">{r.id}</span>,
  },
  {
    key: "editDescription", header: "Edit Request",
    searchValue: (r) => r.editDescription,
    render: (r) => <p className="text-[13px] text-slate-700 line-clamp-2 max-w-xs leading-snug">{r.editDescription}</p>,
  },
  {
    key: "filesCount", header: "Files",
    searchValue: (r) => String(r.filesCount),
    render: (r) => (
      <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        {r.filesCount}
      </span>
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
        {r.adminNote && <p className="text-[11px] text-slate-500 italic line-clamp-1">{r.adminNote}</p>}
      </div>
    ),
  },
  {
    key: "deliveryUrl", header: "Edited Files",
    searchValue: (r) => r.deliveryUrl ?? "",
    render: (r) =>
      r.deliveryUrl ? (
        <a
          href={r.deliveryUrl}
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
        <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
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

export default function EditingPage() {
  const router = useRouter();
  const { user } = useUser();

  // ── Fee ──
  const [feeNGN, setFeeNGN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/editing/fee")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFeeNGN(d.feeNGN); })
      .catch(() => setFeeNGN(800));
  }, []);

  // ── History table ──
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  function loadOrders() {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setTableLoading(false); return; }
    fetch("/api/editing/my-orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }

  useEffect(() => { loadOrders(); }, []);

  // ── Form state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState<{ orderId: string; feeCharged: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fmtNGN = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    };
  }, [uploadedFiles]);

  const handleFilesAdd = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadedFile[] = [];
    const errs: string[] = [];

    for (const f of Array.from(incoming)) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        errs.push(`"${f.name}" is not a supported file type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errs.push(`"${f.name}" exceeds the 10 MB limit.`);
        continue;
      }
      const type = getFileType(f);
      const preview = type === "image" ? URL.createObjectURL(f) : null;
      newFiles.push({ file: f, preview, type });
    }

    if (errs.length) {
      setErrors((e) => ({ ...e, files: errs[0] }));
    } else {
      setErrors((e) => ({ ...e, files: "" }));
    }

    setUploadedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES) {
        setErrors((e) => ({ ...e, files: `Maximum ${MAX_FILES} files allowed.` }));
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }, []);

  function removeFile(i: number) {
    setUploadedFiles((prev) => {
      const copy = [...prev];
      if (copy[i].preview) URL.revokeObjectURL(copy[i].preview!);
      copy.splice(i, 1);
      return copy;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (uploadedFiles.length === 0) errs.files = "Please upload at least one file.";
    if (editDescription.trim().length < 20) errs.editDescription = "Please describe the edits in at least 20 characters.";
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
      // 1) Browser-direct Cloudinary upload (preserves original order so fileTypes line up).
      const assets = await uploadManyToCloudinary(uploadedFiles.map((f) => f.file), {
        folder: "bpoint/editing",
        onProgress: (done, total, pct) =>
          setUploadStatus(`Uploading file ${done + (pct === 100 ? 0 : 1)} of ${total}${pct < 100 ? ` (${pct}%)` : ""}…`),
      });
      setUploadStatus("");

      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/editing/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          editDescription: editDescription.trim(),
          fileUrls:  assets.map((a) => a.url),
          fileTypes: uploadedFiles.map((f) => f.type),
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
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Upload or submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadStatus("");
    }
  }

  function resetForm() {
    uploadedFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setUploadedFiles([]); setEditDescription(""); setAdditionalNotes("");
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
            className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Our team will edit your files and deliver them to you.</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Order ID: <span className="font-mono font-semibold text-slate-600">{success.orderId}</span>
          </p>

          <div className="w-full p-4 rounded-xl bg-pink-50 border border-pink-100 mb-4 space-y-1">
            <p className="text-[12px] font-semibold text-pink-600 uppercase tracking-wider">Service Fee Charged</p>
            <p className="text-[1.8rem] font-extrabold text-pink-700">{fmtNGN(success.feeCharged)}</p>
            <p className="text-[12px] text-pink-600">Deducted from your wallet balance</p>
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
            <p className="text-[13px] text-slate-600">A download link will appear in your <strong>order history</strong> once editing is complete.</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              New Request
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 py-2.5 bg-pink-500 text-white text-[14px] font-semibold rounded-lg hover:bg-pink-600 transition-colors">
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
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Editing Service</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Upload your images or documents, describe what you need edited, and we'll deliver the finished files to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Step 1: Upload Files */}
            <SectionCard step={1} title="Upload Files">
              <div className="space-y-3">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesAdd(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all
                    ${dragOver ? "border-pink-400 bg-pink-50/60 scale-[1.01]" : errors.files ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-pink-400 hover:bg-pink-50/20 bg-slate-50"}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-slate-600">Drop files here or <span className="text-pink-500">browse</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Images (JPG, PNG, WEBP) · Documents (PDF, DOCX, TXT) · Max 10 MB each · Up to 10 files</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => handleFilesAdd(e.target.files)}
                  />
                </div>
                {errors.files && <p className="text-[12px] text-red-500">⚠ {errors.files}</p>}

                {/* File list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white group">
                        {f.type === "image" && f.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.preview} alt={f.file.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {getFileIcon(f.file.type)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-700 truncate">{f.file.name}</p>
                          <p className="text-[11px] text-slate-400">{formatBytes(f.file.size)} · {f.type === "image" ? "Image" : "Document"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {uploadedFiles.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-[12px] font-semibold text-pink-500 hover:text-pink-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add more files ({uploadedFiles.length}/{MAX_FILES})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Step 2: Edit Description */}
            <SectionCard step={2} title="Describe the Edits">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-slate-700">
                  What do you need edited? <span className="text-red-400">*</span>
                </label>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Remove background",
                    "Color correction",
                    "Crop & resize",
                    "Fix text errors",
                    "Reformat document",
                    "Enhance quality",
                    "Remove watermark",
                    "Add text overlay",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditDescription((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Remove the background from all images, crop to a 1:1 ratio, enhance brightness and contrast..."
                  value={editDescription}
                  onChange={(e) => { setEditDescription(e.target.value); setErrors((err) => ({ ...err, editDescription: "" })); }}
                  className={`w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border rounded-xl outline-none resize-none transition-all leading-relaxed
                    focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500
                    ${errors.editDescription ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.editDescription
                    ? <p className="text-[12px] text-red-500">⚠ {errors.editDescription}</p>
                    : <span />
                  }
                  <p className={`text-[11px] ${editDescription.trim().length >= 20 ? "text-emerald-500" : "text-slate-400"}`}>
                    {editDescription.length} / 20 min
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Step 3: Additional Notes */}
            <SectionCard step={3} title="Additional Notes (Optional)">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Anything else the editor should know?</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Preferred output format, color palette, specific fonts to use, turnaround urgency..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none resize-none transition-all leading-relaxed focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                />
              </div>
            </SectionCard>

            {/* Step 4: Terms + Submit */}
            <SectionCard step={4} title="Confirm & Submit">
              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-pink-50 border-pink-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-pink-500 border-pink-500" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I understand the service fee of <strong>{feeNGN !== null ? fmtNGN(feeNGN) : "..."}</strong> will be deducted from my wallet balance upon submission and is non-refundable. Edited files will be delivered via a download link in my order history.
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
                  className="w-full py-3.5 bg-pink-500 text-white text-[15px] font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
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
                      Submit Editing Request
                      {feeNGN !== null && (
                        <span className="ml-1 text-pink-100 text-[13px] font-normal">· {fmtNGN(feeNGN)} fee</span>
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
                <p className="text-[13px] font-bold text-slate-700">Order Summary</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400 font-semibold">Files</span>
                  <span className="text-[13px] font-semibold text-slate-800">
                    {uploadedFiles.length === 0 ? "—" : `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""}`}
                  </span>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {uploadedFiles.filter((f) => f.type === "image").length > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600">
                        {uploadedFiles.filter((f) => f.type === "image").length} image{uploadedFiles.filter((f) => f.type === "image").length > 1 ? "s" : ""}
                      </span>
                    )}
                    {uploadedFiles.filter((f) => f.type === "document").length > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                        {uploadedFiles.filter((f) => f.type === "document").length} doc{uploadedFiles.filter((f) => f.type === "document").length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
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
                icon={<svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                text="Upload your images or documents and describe exactly what edits you need."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                text="Our editor works on your files according to your instructions within 24–48 hours."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                text="A download link for the edited files appears in your order history below once done."
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
          <h3 className="text-[15px] font-bold text-slate-800">My Editing Orders</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Download links appear in the Edited Files column once your order is complete</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
          emptyTitle="No editing orders yet"
          emptyDesc="Your submitted editing requests will appear here with download links once delivered."
        />
      </div>
    </div>
  );
}
