import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import FundRequest from "@/lib/models/FundRequest";
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
    const { amountNGN, receiptUrl } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    const amount = Number(amountNGN);
    if (!amountNGN || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { success: false, message: "Amount must be at least ₦100." },
        { status: 400 }
      );
    }
    if (!receiptUrl || String(receiptUrl).trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Please upload a receipt of your payment." },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Check user exists ─────────────────────────────────────────────────────
    const user = await User.findById(userId).select("isActive");
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: "Account not found or suspended." }, { status: 403 });
    }

    // ── Check for duplicate pending request ───────────────────────────────────
    const existing = await FundRequest.findOne({ userId, status: "pending" });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending fund request. Please wait for it to be reviewed before submitting another.",
          code: "PENDING_EXISTS",
        },
        { status: 409 }
      );
    }

    // ── Create fund request ───────────────────────────────────────────────────
    const request = await FundRequest.create({
      userId,
      amountNGN: amount,
      receiptUrl: String(receiptUrl).trim(),
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Fund request submitted successfully. Your wallet will be credited after admin review.",
      requestId: request._id,
      amountNGN: amount,
    });
  } catch (error) {
    console.error("[POST /api/fund/submit]", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
