import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import ConsignmentOrder from "@/lib/models/ConsignmentOrder";
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
    const { boxDescription, videoInstructions, deliveryAddress, additionalNotes, receiverImageUrl } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!boxDescription || String(boxDescription).trim().length < 20) {
      return NextResponse.json(
        { success: false, message: "Box description must be at least 20 characters." },
        { status: 400 }
      );
    }
    if (!videoInstructions || String(videoInstructions).trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Video instructions must be at least 10 characters." },
        { status: 400 }
      );
    }
    if (!receiverImageUrl || !/^https?:\/\/\S+$/i.test(String(receiverImageUrl).trim())) {
      return NextResponse.json(
        { success: false, message: "Please upload a picture of the receiver." },
        { status: 400 }
      );
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

    const feeNGN = config.consignmentFeeNGN;

    // ── Sufficient balance check ──────────────────────────────────────────────
    if (user.walletBalance < feeNGN) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. You need ₦${feeNGN.toLocaleString()} to submit a consignment video request. Current balance: ₦${user.walletBalance.toLocaleString()}.`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 402 }
      );
    }

    // ── Deduct fee & create order ─────────────────────────────────────────────
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -feeNGN } });

    const order = await ConsignmentOrder.create({
      userId,
      boxDescription: String(boxDescription).trim(),
      videoInstructions: String(videoInstructions).trim(),
      deliveryAddress: deliveryAddress ? String(deliveryAddress).trim() : undefined,
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : undefined,
      receiverImageUrl: String(receiverImageUrl).trim(),
      feeChargedNGN: feeNGN,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Consignment video request submitted successfully.",
      orderId: order._id,
      feeChargedNGN: feeNGN,
    });
  } catch (error) {
    console.error("[POST /api/consignment/submit]", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
