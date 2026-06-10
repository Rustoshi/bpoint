import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import EditingOrder from "@/lib/models/EditingOrder";
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
    const { editDescription, fileUrls, fileTypes, additionalNotes } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!editDescription || String(editDescription).trim().length < 20) {
      return NextResponse.json(
        { success: false, message: "Edit description must be at least 20 characters." },
        { status: 400 }
      );
    }
    if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please upload at least one file to edit." },
        { status: 400 }
      );
    }
    if (!Array.isArray(fileTypes) || fileTypes.length !== fileUrls.length) {
      return NextResponse.json(
        { success: false, message: "File type metadata is invalid." },
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

    const feeNGN = config.editingFeeNGN;

    // ── Sufficient balance check ──────────────────────────────────────────────
    if (user.walletBalance < feeNGN) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. You need ₦${feeNGN.toLocaleString()} to submit an editing request. Current balance: ₦${user.walletBalance.toLocaleString()}.`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 402 }
      );
    }

    // ── Deduct fee & create order ─────────────────────────────────────────────
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -feeNGN } });

    const order = await EditingOrder.create({
      userId,
      editDescription: String(editDescription).trim(),
      fileUrls: fileUrls.slice(0, 10),
      fileTypes: fileTypes.slice(0, 10),
      additionalNotes: additionalNotes ? String(additionalNotes).trim() : undefined,
      feeChargedNGN: feeNGN,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Editing request submitted successfully.",
      orderId: order._id,
      feeChargedNGN: feeNGN,
    });
  } catch (error) {
    console.error("[POST /api/editing/submit]", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
