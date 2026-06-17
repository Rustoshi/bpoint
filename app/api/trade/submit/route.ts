import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import GiftCardRate, { getCurrencyRate } from "@/lib/models/GiftCardRate";
import TradeOrder from "@/lib/models/TradeOrder";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    // Access token is stored in sessionStorage on the client and sent via
    // the Authorization header as "Bearer <token>".
    const authHeader = req.headers.get("authorization") ?? "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(accessToken);
      userId = payload.sub;
    } catch {
      return NextResponse.json(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    // ── Parse body ────────────────────────────────────────────
    const body = await req.json();
    const { brandSlug, cardValue: cardValueRaw, cardValueUSD, submissionType, eCode, ePin, imageUrls, currencyCode: rawCurrency } = body;
    const cardValueInput = cardValueRaw ?? cardValueUSD;
    const currencyCode = (typeof rawCurrency === "string" && rawCurrency.trim()) ? rawCurrency.trim().toUpperCase() : "USD";

    // ── Validate ──────────────────────────────────────────────
    if (!brandSlug || typeof brandSlug !== "string") {
      return NextResponse.json(
        { success: false, message: "Gift card brand is required." },
        { status: 400 }
      );
    }

    const value = Number(cardValueInput);
    if (!value || value < 1 || value > 10000) {
      return NextResponse.json(
        { success: false, message: "Card value must be between 1 and 10,000 in the selected currency." },
        { status: 400 }
      );
    }

    if (!["ecode", "physical"].includes(submissionType)) {
      return NextResponse.json(
        { success: false, message: "Invalid submission type." },
        { status: 400 }
      );
    }

    if (submissionType === "ecode" && !eCode?.trim()) {
      return NextResponse.json(
        { success: false, message: "E-code is required for e-code submissions." },
        { status: 400 }
      );
    }

    if (submissionType === "physical") {
      const urls = Array.isArray(imageUrls) ? imageUrls : [];
      if (urls.length === 0) {
        return NextResponse.json(
          { success: false, message: "At least one card image is required for physical submissions." },
          { status: 400 }
        );
      }
    }

    await connectDB();

    // ── Fetch rate ────────────────────────────────────────────
    const rateDoc = await GiftCardRate.findOne({ slug: brandSlug, isActive: true });
    const currencyRate = rateDoc ? getCurrencyRate(rateDoc, currencyCode) : null;
    const rateSnapshot = currencyRate?.ratePerUnit ?? 1000;
    const currencySymbol = currencyRate?.symbol ?? "$";
    const payoutNGN = value * rateSnapshot;

    // ── Fetch user bank details ───────────────────────────────
    const user = await User.findById(userId).select("bankDetails");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }
    if (!user.bankDetails?.accountNumber) {
      return NextResponse.json(
        { success: false, message: "Please add your bank details in Settings before trading." },
        { status: 400 }
      );
    }

    // ── Create order ──────────────────────────────────────────
    const brandDoc = await GiftCardRate.findOne({ slug: brandSlug });
    const order = await TradeOrder.create({
      userId,
      brand: brandDoc?.brand ?? brandSlug,
      brandSlug,
      cardValue: value,
      currencyCode,
      currencySymbol,
      submissionType,
      eCode: submissionType === "ecode" ? eCode.trim() : undefined,
      ePin: ePin?.trim() || undefined,
      imageUrls: submissionType === "physical" ? (imageUrls ?? []) : [],
      rateSnapshot,
      payoutNGN,
      bankSnapshot: {
        accountNumber: user.bankDetails.accountNumber,
        bankName: user.bankDetails.bankName,
        nameOnBank: user.bankDetails.nameOnBank,
      },
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Trade submitted successfully! Payout will be sent to your bank account within 5–15 minutes.",
        orderId: order._id,
        payoutNGN,
        rateSnapshot,
        currencyCode,
        currencySymbol,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/trade/submit]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
