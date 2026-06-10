"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ServiceKey = "trade" | "recovery" | "consignment" | "editing" | "lipsync" | "fund";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

const DISPLAY_NAME: Record<ServiceKey, string> = {
  trade:       "Trade",
  recovery:    "Recovery",
  consignment: "Consignment",
  editing:     "Editing",
  lipsync:     "Lipsync",
  fund:        "Fund Request",
};

const STATUS_OPTIONS: Record<ServiceKey, string[]> = {
  trade:       ["pending", "reviewing", "approved", "paid", "rejected"],
  recovery:    ["pending", "reviewing", "recovered", "unrecoverable", "cancelled"],
  consignment: ["pending", "processing", "delivered", "cancelled"],
  editing:     ["pending", "in-progress", "delivered", "cancelled"],
  lipsync:     ["pending", "in-progress", "delivered", "cancelled"],
  fund:        ["pending", "approved", "rejected"],
};

const TYPE_COLORS: Record<string, string> = {
  "Trade":        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Recovery":     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Consignment":  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Editing":      "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Lipsync":      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Fund Request": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const STATUS_COLORS: Record<string, string> = {
  pending:        "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reviewing:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "in-progress":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paid:           "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  delivered:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  recovered:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected:       "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled:      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  unrecoverable:  "bg-red-500/10 text-red-400 border-red-500/20",
};

const DELIVERABLE: ServiceKey[] = ["consignment", "editing", "lipsync"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  const token = sessionStorage.getItem("admin_access_token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const fmtDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

const fmtNGN = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n)
    : "—";

// ─── UI bits ───────────────────────────────────────────────────────────────────

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="text-[13px] text-slate-200 mt-1 break-words">{value || <span className="text-slate-600">—</span>}</div>
    </div>
  );
}

const IMG_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const isImageUrl = (u: string) =>
  IMG_EXT.test(u) || /\/image\/upload\//.test(u);

function FileList({ urls }: { urls?: string[] }) {
  if (!urls?.length) return <span className="text-slate-600">—</span>;
  const images = urls.filter(isImageUrl);
  const other  = urls.filter((u) => !isImageUrl(u));
  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((u, i) => (
            <a
              key={`img-${i}`}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="group block aspect-square bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-colors"
              title="Open original"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u}
                alt={`Attachment ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
      {other.length > 0 && (
        <ul className="space-y-1">
          {other.map((u, i) => (
            <li key={`f-${i}`}>
              <a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[12px] underline break-all">
                File {i + 1}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

// ─── Delivery section (with browser-direct Cloudinary upload) ──────────────────

function DeliverySection({
  deliveryField, deliveryUrl, setDeliveryUrl, saveDelivery, savingDelivery, serviceType,
}: {
  deliveryField: "deliveryUrl" | "proofVideoUrl";
  deliveryUrl:    string;
  setDeliveryUrl: (v: string) => void;
  saveDelivery:   () => void;
  savingDelivery: boolean;
  serviceType:    ServiceKey;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState("");

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    setUploadPct(1);
    try {
      const asset = await uploadToCloudinary(file, {
        folder: `bpoint/${serviceType}-delivery`,
        onProgress: setUploadPct,
      });
      setDeliveryUrl(asset.url);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  const label = deliveryField === "proofVideoUrl" ? "Proof video" : "Delivery";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</h3>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={deliveryUrl}
          onChange={(e) => setDeliveryUrl(e.target.value)}
          placeholder="https://… (or use Upload)"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold whitespace-nowrap disabled:opacity-50"
        >
          {uploading ? `Uploading ${uploadPct}%…` : "Upload file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={deliveryField === "proofVideoUrl" ? "video/*,image/*" : "image/*,video/*,audio/*,.pdf,.zip"}
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      {uploadErr && <p className="text-[12px] text-red-400">{uploadErr}</p>}

      <button
        onClick={saveDelivery}
        disabled={savingDelivery || uploading || !deliveryUrl.trim()}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold disabled:opacity-50"
      >
        {savingDelivery ? "Saving…" : `Save ${label.toLowerCase()} URL`}
      </button>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrderDetailPageInner />
    </Suspense>
  );
}

function AdminOrderDetailPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id   = params.id;
  const type = (searchParams.get("type") ?? "") as ServiceKey;

  const [order, setOrder] = useState<AnyDoc | null>(null);
  const [user,  setUser]  = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [statusValue, setStatusValue] = useState("");
  const [noteValue,   setNoteValue]   = useState("");
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const isValidType = !!STATUS_OPTIONS[type];

  const load = useCallback(async () => {
    if (!isValidType) { setLoading(false); setLoadError("Invalid or missing order type."); return; }
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/admin/orders/${id}?type=${type}`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to load order.");
      setOrder(data.order);
      setUser(data.user);
      setStatusValue(data.order.status);
      setNoteValue(data.order.adminNote ?? "");
      setDeliveryUrl(data.order.deliveryUrl ?? data.order.proofVideoUrl ?? "");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [id, type, isValidType]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_access_token");
    if (!token) { router.replace("/admin/login"); return; }
    load();
  }, [router, load]);

  async function saveStatus() {
    setSaving(true);
    setError("");
    setFlash("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ type, status: statusValue, adminNote: noteValue }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save.");
      setOrder(data.order);
      setFlash("Saved.");
      setTimeout(() => setFlash(""), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDelivery() {
    setSavingDelivery(true);
    setError("");
    setFlash("");
    try {
      const res = await fetch(`/api/admin/orders/${id}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ type, deliveryUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Failed to save delivery URL.");
      setOrder(data.order);
      setFlash("Delivery URL saved.");
      setTimeout(() => setFlash(""), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save delivery URL.");
    } finally {
      setSavingDelivery(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/orders" className="text-[13px] text-slate-400 hover:text-white">← Back to orders</Link>
        <div className="mt-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-[14px] text-red-300 font-semibold">{loadError || "Order not found."}</p>
        </div>
      </div>
    );
  }

  const displayName  = DISPLAY_NAME[type];
  const isDeliverable = DELIVERABLE.includes(type);
  const deliveryField: "deliveryUrl" | "proofVideoUrl" = type === "consignment" ? "proofVideoUrl" : "deliveryUrl";

  const amount = type === "trade"
    ? order.payoutNGN
    : type === "fund"
      ? order.amountNGN
      : order.feeChargedNGN;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to orders
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={displayName} colorClass={TYPE_COLORS[displayName] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
              <Badge label={order.status} colorClass={STATUS_COLORS[order.status] ?? "bg-slate-700 text-slate-300 border-slate-600"} />
            </div>
            <h2 className="text-[1.2rem] font-extrabold text-white tracking-tight">Order detail</h2>
            <p className="text-[11px] font-mono text-slate-500">{id}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Amount</p>
            <p className="text-[1.4rem] font-extrabold text-white">{fmtNGN(amount)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Submitted {fmtDate(order.createdAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* User */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="User" value={user?.name} />
        <Field label="Email" value={user?.email} />
        <Field
          label="Actions"
          value={
            user && (
              <Link href={`/admin/messages?userId=${user.id}`} className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[12px] font-semibold">
                Message user
              </Link>
            )
          }
        />
      </div>

      {/* Type-specific details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Details</h3>

        {type === "trade" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Brand" value={order.brand} />
            <Field label="Card value" value={`$${order.cardValueUSD}`} />
            <Field label="Rate snapshot" value={order.rateSnapshot} />
            <Field label="Payout (₦)" value={order.payoutNGN?.toLocaleString()} />
            <Field label="Submission" value={order.submissionType} />
            {order.submissionType === "ecode" ? (
              <>
                <Field label="eCode" value={<span className="font-mono break-all">{order.eCode}</span>} />
                <Field label="ePin" value={<span className="font-mono break-all">{order.ePin}</span>} />
              </>
            ) : (
              <div className="col-span-2 sm:col-span-3">
                <Field label="Images" value={<FileList urls={order.imageUrls} />} />
              </div>
            )}
            <div className="col-span-2 sm:col-span-3">
              <Field
                label="Bank snapshot"
                value={order.bankSnapshot ? `${order.bankSnapshot.bankName} — ${order.bankSnapshot.accountNumber} (${order.bankSnapshot.nameOnBank})` : "—"}
              />
            </div>
          </div>
        )}

        {type === "recovery" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Brand" value={order.brand} />
            <Field label="Card value" value={`$${order.cardValueUSD}`} />
            <Field label="Issue type" value={order.issueType} />
            <Field label="Purchase store" value={order.purchaseStore} />
            <Field label="Purchase date" value={order.purchaseDate} />
            <Field label="Recovered code" value={order.recoveredCode ? <span className="font-mono">{order.recoveredCode}</span> : "—"} />
            <div className="col-span-2 sm:col-span-3"><Field label="Description" value={order.issueDescription} /></div>
            <div className="col-span-2 sm:col-span-3"><Field label="Images" value={<FileList urls={order.imageUrls} />} /></div>
            {order.receiptUrl && (
              <div className="col-span-2 sm:col-span-3">
                <Field label="Receipt" value={<a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-[12px] break-all">{order.receiptUrl}</a>} />
              </div>
            )}
          </div>
        )}

        {type === "consignment" && (
          <div className="space-y-4">
            <Field label="Box description" value={order.boxDescription} />
            <Field label="Video instructions" value={order.videoInstructions} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Delivery address" value={order.deliveryAddress} />
              <Field label="Additional notes" value={order.additionalNotes} />
            </div>
            {order.proofVideoUrl && (
              <Field label="Proof video" value={<a href={order.proofVideoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-[12px] break-all">{order.proofVideoUrl}</a>} />
            )}
          </div>
        )}

        {type === "editing" && (
          <div className="space-y-4">
            <Field label="Edit description" value={order.editDescription} />
            <Field label="Additional notes" value={order.additionalNotes} />
            <Field label="Uploaded files" value={<FileList urls={order.fileUrls} />} />
            {order.deliveryUrl && (
              <Field label="Delivery" value={<a href={order.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-[12px] break-all">{order.deliveryUrl}</a>} />
            )}
          </div>
        )}

        {type === "lipsync" && (
          <div className="space-y-4">
            <Field label="Description" value={order.lipsyncDescription} />
            <Field label="Additional notes" value={order.additionalNotes} />
            <Field label="Uploaded files" value={<FileList urls={order.fileUrls} />} />
            {order.deliveryUrl && (
              <Field label="Delivery" value={<a href={order.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-[12px] break-all">{order.deliveryUrl}</a>} />
            )}
          </div>
        )}

        {type === "fund" && (
          <div className="space-y-4">
            <Field label="Amount (₦)" value={order.amountNGN?.toLocaleString()} />
            {order.receiptUrl && (
              <Field label="Receipt" value={<a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-[12px] break-all">{order.receiptUrl}</a>} />
            )}
            {statusValue === "approved" && order.status !== "approved" && (
              <p className="text-[12px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                Approving will credit ₦{order.amountNGN?.toLocaleString()} to {user?.name ?? "the user"}&apos;s wallet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status + admin note */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Update</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500"
            >
              {STATUS_OPTIONS[type].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Admin note</label>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-blue-500 resize-none"
              placeholder="Note saved alongside status change…"
            />
          </div>
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}
        {flash && <p className="text-[12px] text-emerald-400">{flash}</p>}

        <button
          onClick={saveStatus}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Delivery URL */}
      {isDeliverable && (
        <DeliverySection
          deliveryField={deliveryField}
          deliveryUrl={deliveryUrl}
          setDeliveryUrl={setDeliveryUrl}
          saveDelivery={saveDelivery}
          savingDelivery={savingDelivery}
          serviceType={type}
        />
      )}
    </div>
  );
}
