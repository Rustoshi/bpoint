import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import RecoveryRequest from "@/lib/models/RecoveryRequest";
import { getSiteConfig } from "@/lib/models/SiteConfig";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      return NextResponse.json({ success: false, message: "Session expired. Please log in again." }, { status: 401 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      brandSlug,
      brand,
      cardValueUSD,
      issueType,
      issueDescription,
      imageUrls,
      receiptUrl,
      purchaseStore,
      purchaseDate,
    } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!brandSlug || !brand) {
      return NextResponse.json({ success: false, message: "Please select a gift card brand." }, { status: 400 });
    }
    if (!cardValueUSD || Number(cardValueUSD) < 1) {
      return NextResponse.json({ success: false, message: "Card value must be at least $1." }, { status: 400 });
    }
    const validIssueTypes = ["scratched-off", "missing-code", "damaged-card", "not-loading", "other"];
    if (!issueType || !validIssueTypes.includes(issueType)) {
      return NextResponse.json({ success: false, message: "Please select an issue type." }, { status: 400 });
    }
    if (!issueDescription || String(issueDescription).trim().length < 10) {
      return NextResponse.json({ success: false, message: "Please provide a description of at least 10 characters." }, { status: 400 });
    }
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ success: false, message: "At least one card image is required." }, { status: 400 });
    }

    await connectDB();

    // ── Fetch fee & user ──────────────────────────────────────────────────────
    const [config, user] = await Promise.all([
      getSiteConfig(),
      User.findById(userId).select("walletBalance isActive"),
    ]);

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: "Account not found or suspended." }, { status: 403 });
    }

    const feeNGN = config.recoveryFeeNGN;

    // ── Sufficient balance check ──────────────────────────────────────────────
    if (user.walletBalance < feeNGN) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. You need ₦${feeNGN.toLocaleString()} to submit a recovery request. Current balance: ₦${user.walletBalance.toLocaleString()}.`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 402 }
      );
    }

    // ── Deduct fee & create request atomically ────────────────────────────────
    // Deduct from wallet
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -feeNGN } });

    const request = await RecoveryRequest.create({
      userId,
      brand: String(brand).trim(),
      brandSlug: String(brandSlug).toLowerCase().trim(),
      cardValueUSD: Number(cardValueUSD),
      issueType,
      issueDescription: String(issueDescription).trim(),
      imageUrls: imageUrls.slice(0, 6),
      receiptUrl: receiptUrl ? String(receiptUrl).trim() : undefined,
      purchaseStore: purchaseStore ? String(purchaseStore).trim() : undefined,
      purchaseDate: purchaseDate ? String(purchaseDate).trim() : undefined,
      feeChargedNGN: feeNGN,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Recovery request submitted successfully.",
      requestId: request._id,
      feeChargedNGN: feeNGN,
    });
  } catch (error) {
    console.error("[POST /api/recover/submit]", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
