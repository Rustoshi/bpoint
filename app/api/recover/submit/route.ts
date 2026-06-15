import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import RecoveryRequest from "@/lib/models/RecoveryRequest";
import GiftCardRate from "@/lib/models/GiftCardRate";
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

    // ── Parse body ──────────────────────────────────────────────────────────────
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

    // ── Validate ────────────────────────────────────────────────────────────────
    if (!brandSlug || !brand) {
      return NextResponse.json({ success: false, message: "Please select a gift card brand." }, { status: 400 });
    }
    const value = Number(cardValueUSD);
    if (!value || value < 1 || value > 10000) {
      return NextResponse.json({ success: false, message: "Card value must be between $1 and $10,000." }, { status: 400 });
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

    // ── Fetch user & rate ─────────────────────────────────────────────────────
    const user = await User.findById(userId).select("bankDetails isActive");
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: "Account not found or suspended." }, { status: 403 });
    }
    if (!user.bankDetails?.accountNumber) {
      return NextResponse.json(
        { success: false, message: "Please add your bank details in Settings before submitting a recovery." },
        { status: 400 }
      );
    }

    // Rate is locked in at submission time — value paid out on successful recovery.
    const rateDoc = await GiftCardRate.findOne({ slug: String(brandSlug).toLowerCase().trim(), isActive: true });
    const rateSnapshot = rateDoc?.ratePerDollar ?? 1000;
    const payoutNGN = value * rateSnapshot;

    // ── Create request ────────────────────────────────────────────────────────
    const request = await RecoveryRequest.create({
      userId,
      brand: String(brand).trim(),
      brandSlug: String(brandSlug).toLowerCase().trim(),
      cardValueUSD: value,
      issueType,
      issueDescription: String(issueDescription).trim(),
      imageUrls: imageUrls.slice(0, 6),
      receiptUrl: receiptUrl ? String(receiptUrl).trim() : undefined,
      purchaseStore: purchaseStore ? String(purchaseStore).trim() : undefined,
      purchaseDate: purchaseDate ? String(purchaseDate).trim() : undefined,
      rateSnapshot,
      payoutNGN,
      bankSnapshot: {
        accountNumber: user.bankDetails.accountNumber,
        bankName: user.bankDetails.bankName,
        nameOnBank: user.bankDetails.nameOnBank,
      },
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Recovery request submitted successfully. If the code is recovered, your payout will be sent to your bank account.",
      requestId: request._id,
      payoutNGN,
      rateSnapshot,
    });
  } catch (error) {
    console.error("[POST /api/recover/submit]", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
