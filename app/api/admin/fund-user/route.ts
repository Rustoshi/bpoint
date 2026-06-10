import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/lib/models/User";
import FundRequest from "@/lib/models/FundRequest";

function requireAdmin(req: NextRequest): { ok: true; adminId: string } | { ok: false } {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return { ok: false };
  try {
    const payload = verifyAccessToken(token);
    if (payload.role !== "admin") return { ok: false };
    return { ok: true, adminId: payload.sub };
  } catch { return { ok: false }; }
}

const ADMIN_CREDIT_SENTINEL = "ADMIN_CREDIT";

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { email?: string; amountNGN?: number; note?: string } | null;
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const amount = Number(body.amountNGN);
  const note = String(body.note ?? "").trim();

  if (!email) {
    return NextResponse.json({ success: false, message: "User email is required." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json({ success: false, message: "Amount must be at least ₦100." }, { status: 400 });
  }
  if (amount > 10_000_000) {
    return NextResponse.json({ success: false, message: "Amount exceeds the ₦10,000,000 single-transaction limit." }, { status: 400 });
  }
  if (note.length > 500) {
    return NextResponse.json({ success: false, message: "Note cannot exceed 500 characters." }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email }).select("_id firstName lastName email walletBalance isActive");
    if (!user) {
      return NextResponse.json({ success: false, message: "No user with that email." }, { status: 404 });
    }
    if (!user.isActive) {
      return NextResponse.json({ success: false, message: "This account is suspended." }, { status: 400 });
    }

    const adminNote = note
      ? `Funded by admin. Note: ${note}`
      : `Funded by admin.`;

    // Create the payment-history record (FundRequest powers the user's deposit history)
    const fundRequest = await new FundRequest({
      userId:      user._id,
      amountNGN:   amount,
      receiptUrl:  ADMIN_CREDIT_SENTINEL,
      status:      "approved",
      adminNote,
      reviewedAt:  new Date(),
    }).save();

    // Credit the wallet
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).select("walletBalance firstName lastName email");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = updated as any;

    return NextResponse.json({
      success: true,
      fundRequestId: fundRequest._id.toString(),
      user: {
        id:                u._id.toString(),
        name:              `${u.firstName} ${u.lastName}`,
        email:             u.email,
        newWalletBalance:  u.walletBalance,
      },
      creditedAmount: amount,
    });
  } catch (err) {
    console.error("[POST /api/admin/fund-user]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
