import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import { getSiteConfig } from "@/lib/models/SiteConfig";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

const ACCT_RE = /^\d{10}$/;

type ConfigUpdates = {
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  dollarToNairaRate?: number;
  recoveryFeeNGN?: number;
  consignmentFeeNGN?: number;
  editingFeeNGN?: number;
  lipsyncFeeNGN?: number;
  supportEmail?: string;
  whatsappNumber?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_RE = /^\d{8,15}$/;

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as ConfigUpdates | null;
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.bankAccountName !== undefined) {
    const v = String(body.bankAccountName).trim();
    if (!v) return NextResponse.json({ success: false, message: "Bank account name is required." }, { status: 400 });
    updates.bankAccountName = v;
  }
  if (body.bankAccountNumber !== undefined) {
    const v = String(body.bankAccountNumber).trim();
    if (!ACCT_RE.test(v)) return NextResponse.json({ success: false, message: "Bank account number must be 10 digits." }, { status: 400 });
    updates.bankAccountNumber = v;
  }
  if (body.bankName !== undefined) {
    const v = String(body.bankName).trim();
    if (!v) return NextResponse.json({ success: false, message: "Bank name is required." }, { status: 400 });
    updates.bankName = v;
  }

  const validatePositive = (label: string, min: number, n: unknown): number | NextResponse => {
    const v = Number(n);
    if (!Number.isFinite(v) || v < min) {
      return NextResponse.json({ success: false, message: `${label} must be at least ${min}.` }, { status: 400 });
    }
    return v;
  };

  if (body.dollarToNairaRate !== undefined) {
    const r = validatePositive("Dollar→Naira rate", 1, body.dollarToNairaRate);
    if (r instanceof NextResponse) return r;
    updates.dollarToNairaRate = r;
  }
  if (body.recoveryFeeNGN !== undefined) {
    const r = validatePositive("Recovery fee", 0, body.recoveryFeeNGN);
    if (r instanceof NextResponse) return r;
    updates.recoveryFeeNGN = r;
  }
  if (body.consignmentFeeNGN !== undefined) {
    const r = validatePositive("Consignment fee", 0, body.consignmentFeeNGN);
    if (r instanceof NextResponse) return r;
    updates.consignmentFeeNGN = r;
  }
  if (body.editingFeeNGN !== undefined) {
    const r = validatePositive("Editing fee", 0, body.editingFeeNGN);
    if (r instanceof NextResponse) return r;
    updates.editingFeeNGN = r;
  }
  if (body.lipsyncFeeNGN !== undefined) {
    const r = validatePositive("Lipsync fee", 0, body.lipsyncFeeNGN);
    if (r instanceof NextResponse) return r;
    updates.lipsyncFeeNGN = r;
  }
  if (body.supportEmail !== undefined) {
    const v = String(body.supportEmail).trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return NextResponse.json({ success: false, message: "Support email is invalid." }, { status: 400 });
    updates.supportEmail = v;
  }
  if (body.whatsappNumber !== undefined) {
    const v = String(body.whatsappNumber).replace(/[\s+\-()]/g, "");
    if (!WHATSAPP_RE.test(v)) return NextResponse.json({ success: false, message: "WhatsApp number must be 8–15 digits (country code included, no '+')." }, { status: 400 });
    updates.whatsappNumber = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "No changes provided." }, { status: 400 });
  }

  try {
    await connectDB();
    const config = await getSiteConfig();
    Object.assign(config, updates);
    await config.save();

    return NextResponse.json({
      success: true,
      config: {
        bankAccountName:   String(config.bankAccountName   ?? ""),
        bankAccountNumber: String(config.bankAccountNumber ?? ""),
        bankName:          String(config.bankName          ?? ""),
        dollarToNairaRate: Number(config.dollarToNairaRate ?? 0),
        recoveryFeeNGN:    Number(config.recoveryFeeNGN    ?? 0),
        consignmentFeeNGN: Number(config.consignmentFeeNGN ?? 0),
        editingFeeNGN:     Number(config.editingFeeNGN     ?? 0),
        lipsyncFeeNGN:     Number(config.lipsyncFeeNGN     ?? 0),
        supportEmail:      String(config.supportEmail      ?? ""),
        whatsappNumber:    String(config.whatsappNumber    ?? ""),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/config]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
