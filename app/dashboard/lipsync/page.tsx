"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { useUser } from "@/lib/hooks/useUser";
import { uploadManyToCloudinary } from "@/lib/cloudinary";

// ─── File helpers ──────────────────────────────────────────────────────────────

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/aac"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_TYPES = [...VIDEO_TYPES, ...AUDIO_TYPES, ...IMAGE_TYPES];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB for video/audio
const MAX_FILES = 5;

type FileKind = "video" | "audio" | "image";

type UploadedFile = {
  file: File;
  preview: string | null;
  kind: FileKind;
};

function getFileKind(f: File): FileKind {
  if (VIDEO_TYPES.includes(f.type)) return "video";
  if (AUDIO_TYPES.includes(f.type)) return "audio";
  return "image";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KindBadge({ kind }: { kind: FileKind }) {
  const map: Record<FileKind, string> = {
    video: "bg-cyan-50 text-cyan-600 border-cyan-200",
    audio: "bg-violet-50 text-violet-600 border-violet-200",
    image: "bg-pink-50 text-pink-600 border-pink-200",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${map[kind]}`}>
      {kind}
    </span>
  );
}

function FileIcon({ kind }: { kind: FileKind }) {
  if (kind === "video") {
    return (
      <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (kind === "audio") {
    return (
      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

// ─── Table types ───────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  lipsyncDescription: string;
  filesCount: number;
  fee: string;
  date: string;
  status: string;
  deliveryUrl: string | null;
  adminNote: string | null;
};

const statusStyles: Record<string, string> = {
  Pending:       "text-amber-700 bg-amber-50 border-amber-200",
  "In Progress": "text-cyan-700 bg-cyan-50 border-cyan-200",
  Delivered:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  Cancelled:     "text-slate-600 bg-slate-50 border-slate-200",
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
    key: "lipsyncDescription", header: "Request",
    searchValue: (r) => r.lipsyncDescription,
    render: (r) => <p className="text-[13px] text-slate-700 line-clamp-2 max-w-xs leading-snug">{r.lipsyncDescription}</p>,
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
    key: "deliveryUrl", header: "Output Video",
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
        <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">
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

export default function LipsyncPage() {
  const router = useRouter();
  const { user } = useUser();

  // ── Fee ──
  const [feeNGN, setFeeNGN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/lipsync/fee")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFeeNGN(d.feeNGN); })
      .catch(() => setFeeNGN(1500));
  }, []);

  // ── History table ──
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  function loadOrders() {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setTableLoading(false); return; }
    fetch("/api/lipsync/my-orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }

  useEffect(() => { loadOrders(); }, []);

  // ── Form state ──
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [lipsyncDescription, setLipsyncDescription] = useState("");
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
        errs.push(`"${f.name}" exceeds the 100 MB limit.`);
        continue;
      }
      const kind = getFileKind(f);
      const preview = kind === "image" ? URL.createObjectURL(f) : null;
      newFiles.push({ file: f, preview, kind });
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
    if (uploadedFiles.length === 0) errs.files = "Please upload at least one media file.";
    if (lipsyncDescription.trim().length < 20) errs.lipsyncDescription = "Please describe your request in at least 20 characters.";
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
      // 1) Browser-direct Cloudinary upload — videos/audio also handled by /auto/upload.
      const assets = await uploadManyToCloudinary(uploadedFiles.map((f) => f.file), {
        folder: "bpoint/lipsync",
        onProgress: (done, total, pct) =>
          setUploadStatus(`Uploading file ${done + (pct === 100 ? 0 : 1)} of ${total}${pct < 100 ? ` (${pct}%)` : ""}…`),
      });
      setUploadStatus("");

      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/lipsync/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lipsyncDescription: lipsyncDescription.trim(),
          fileUrls:  assets.map((a) => a.url),
          fileTypes: uploadedFiles.map((f) => f.kind),
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
    setUploadedFiles([]); setLipsyncDescription(""); setAdditionalNotes("");
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
            className="w-20 h-20 rounded-full bg-cyan-100 flex items-center justify-center mb-6"
          >
            <svg className="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-[14px] text-slate-500 mb-1">Our team will create your lipsync video and deliver it to you.</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Order ID: <span className="font-mono font-semibold text-slate-600">{success.orderId}</span>
          </p>

          <div className="w-full p-4 rounded-xl bg-cyan-50 border border-cyan-100 mb-4 space-y-1">
            <p className="text-[12px] font-semibold text-cyan-600 uppercase tracking-wider">Service Fee Charged</p>
            <p className="text-[1.8rem] font-extrabold text-cyan-700">{fmtNGN(success.feeCharged)}</p>
            <p className="text-[12px] text-cyan-600">Deducted from your wallet balance</p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-100 w-full mb-4">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[13px] text-blue-700">Expected delivery: <strong>24–72 hours</strong></p>
          </div>

          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 w-full mb-6">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-[13px] text-slate-600">A download link for the output video will appear in your <strong>order history</strong> once complete.</p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={resetForm} className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              New Request
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex-1 py-2.5 bg-cyan-500 text-white text-[14px] font-semibold rounded-lg hover:bg-cyan-600 transition-colors">
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
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 tracking-tight">Lipsync Video</h2>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Upload your media content and describe how you want the lipsync created. We'll deliver the finished video to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Step 1: Upload Media */}
            <SectionCard step={1} title="Upload Media">
              <div className="space-y-3">
                <p className="text-[12px] text-slate-400">
                  Upload the video clip to lipsync, the audio/voice track, or reference images. Up to {MAX_FILES} files · Max 100 MB each.
                </p>

                {/* Accepted format pills */}
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {[
                    { label: "MP4, MOV, WEBM", color: "bg-cyan-50 border-cyan-200 text-cyan-600" },
                    { label: "MP3, WAV, AAC", color: "bg-violet-50 border-violet-200 text-violet-600" },
                    { label: "JPG, PNG, WEBP", color: "bg-pink-50 border-pink-200 text-pink-600" },
                  ].map((f) => (
                    <span key={f.label} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${f.color}`}>
                      {f.label}
                    </span>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesAdd(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all
                    ${dragOver ? "border-cyan-400 bg-cyan-50/60 scale-[1.01]" : errors.files ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/20 bg-slate-50"}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-slate-600">Drop media here or <span className="text-cyan-500">browse</span></p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Video, audio, or image files · Max 100 MB each</p>
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
                        {f.kind === "image" && f.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.preview} alt={f.file.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <FileIcon kind={f.kind} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-700 truncate">{f.file.name}</p>
                            <p className="text-[11px] text-slate-400">{formatBytes(f.file.size)}</p>
                          </div>
                          <KindBadge kind={f.kind} />
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
                        className="flex items-center gap-2 text-[12px] font-semibold text-cyan-500 hover:text-cyan-600 transition-colors"
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

            {/* Step 2: Lipsync Description */}
            <SectionCard step={2} title="Describe Your Lipsync">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold text-slate-700">
                  What do you want? <span className="text-red-400">*</span>
                </label>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Sync audio to video",
                    "Replace original audio",
                    "Match lip movements",
                    "Add background music",
                    "Translate & lipsync",
                    "Dub voice over",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setLipsyncDescription((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Sync the uploaded audio track to the video clip, match lip movements as closely as possible, keep the original background audio..."
                  value={lipsyncDescription}
                  onChange={(e) => { setLipsyncDescription(e.target.value); setErrors((err) => ({ ...err, lipsyncDescription: "" })); }}
                  className={`w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border rounded-xl outline-none resize-none transition-all leading-relaxed
                    focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500
                    ${errors.lipsyncDescription ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.lipsyncDescription
                    ? <p className="text-[12px] text-red-500">⚠ {errors.lipsyncDescription}</p>
                    : <span />
                  }
                  <p className={`text-[11px] ${lipsyncDescription.trim().length >= 20 ? "text-emerald-500" : "text-slate-400"}`}>
                    {lipsyncDescription.length} / 20 min
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Step 3: Additional Notes */}
            <SectionCard step={3} title="Additional Notes (Optional)">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-slate-700">Anything else to know?</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Preferred output resolution, language, accent, video format, specific timecodes to focus on..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3.5 py-3 text-[13px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl outline-none resize-none transition-all leading-relaxed focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </SectionCard>

            {/* Step 4: Terms + Submit */}
            <SectionCard step={4} title="Confirm & Submit">
              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                  ${agreed ? "bg-cyan-50 border-cyan-200" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${agreed ? "bg-cyan-500 border-cyan-500" : "border-slate-300 bg-white"}`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((err) => ({ ...err, agreed: "" })); }} />
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    I understand the service fee of <strong>{feeNGN !== null ? fmtNGN(feeNGN) : "..."}</strong> will be deducted from my wallet balance upon submission and is non-refundable. The output video will be delivered via a download link in my order history.
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
                  className="w-full py-3.5 bg-cyan-500 text-white text-[15px] font-bold rounded-xl hover:bg-cyan-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-200"
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Lipsync Request
                      {feeNGN !== null && (
                        <span className="ml-1 text-cyan-100 text-[13px] font-normal">· {fmtNGN(feeNGN)} fee</span>
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
                    {(["video", "audio", "image"] as FileKind[]).map((kind) => {
                      const count = uploadedFiles.filter((f) => f.kind === kind).length;
                      if (!count) return null;
                      return <KindBadge key={kind} kind={kind} />;
                    })}
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
                icon={<svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
                text="Upload your video clip, audio track, or reference images and describe what you need."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                text="Our team creates the lipsync video according to your instructions within 24–72 hours."
              />
              <InfoRow
                icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                text="A download link for the finished video appears in your order history once it's ready."
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
          <h3 className="text-[15px] font-bold text-slate-800">My Lipsync Orders</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Download links appear in the Output Video column once your order is complete</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          emptyTitle="No lipsync orders yet"
          emptyDesc="Your submitted lipsync requests will appear here with download links once delivered."
        />
      </div>
    </div>
  );
}
