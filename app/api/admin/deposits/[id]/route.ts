import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import FundRequest from "@/lib/models/FundRequest";
import User from "@/lib/models/User";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid deposit id." }, { status: 400 });
  }

  try {
    await connectDB();

    const deposit = await FundRequest.findById(id).lean() as AnyDoc | null;
    if (!deposit) {
      return NextResponse.json({ success: false, message: "Deposit not found." }, { status: 404 });
    }

    const user = await User.findById(deposit.userId)
      .select("firstName lastName email phone walletBalance bankDetails isActive")
      .lean() as AnyDoc | null;

    return NextResponse.json({
      success: true,
      deposit: {
        id:         deposit._id.toString(),
        userId:     deposit.userId.toString(),
        amountNGN:  deposit.amountNGN,
        status:     deposit.status,
        receiptUrl: deposit.receiptUrl,
        adminNote:  deposit.adminNote ?? "",
        createdAt:  new Date(deposit.createdAt).toISOString(),
        reviewedAt: deposit.reviewedAt ? new Date(deposit.reviewedAt).toISOString() : null,
      },
      user: user ? {
        id:            user._id.toString(),
        name:          `${user.firstName} ${user.lastName}`,
        email:         user.email,
        phone:         user.phone,
        walletBalance: user.walletBalance ?? 0,
        bankDetails:   user.bankDetails ?? null,
        isActive:      user.isActive,
      } : null,
    });
  } catch (err) {
    console.error("[GET /api/admin/deposits/[id]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
