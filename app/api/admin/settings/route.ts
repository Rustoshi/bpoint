import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import { getSiteConfig } from "@/lib/models/SiteConfig";
import GiftCardRate from "@/lib/models/GiftCardRate";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    await connectDB();
    const config = await getSiteConfig();
    const rates  = await GiftCardRate.find({}).sort({ brand: 1 }).lean();

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
      },
      rates: rates.map((r) => ({
        id:             String(r._id),
        brand:          r.brand,
        slug:           r.slug,
        ratePerDollar:  r.ratePerDollar,
        isActive:       r.isActive,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/settings]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
