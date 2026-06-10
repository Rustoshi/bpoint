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

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid deposit id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as { action?: string; note?: string } | null;
  const action = body?.action;
  const note   = String(body?.note ?? "").trim();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ success: false, message: "Action must be 'approve' or 'reject'." }, { status: 400 });
  }
  if (note.length > 500) {
    return NextResponse.json({ success: false, message: "Note cannot exceed 500 characters." }, { status: 400 });
  }

  try {
    await connectDB();

    const deposit = await FundRequest.findById(id);
    if (!deposit) {
      return NextResponse.json({ success: false, message: "Deposit not found." }, { status: 404 });
    }

    const previousStatus = deposit.status;
    const newStatus      = action === "approve" ? "approved" : "rejected";

    // Idempotency — already in the target terminal state
    if (previousStatus === newStatus) {
      return NextResponse.json({
        success: true,
        message: `Deposit already ${newStatus}.`,
        deposit: {
          id:         deposit._id.toString(),
          status:     deposit.status,
          adminNote:  deposit.adminNote ?? "",
          reviewedAt: deposit.reviewedAt ? deposit.reviewedAt.toISOString() : null,
        },
      });
    }

    // Credit wallet only on the first transition into approved
    let newBalance: number | null = null;
    if (action === "approve" && previousStatus !== "approved") {
      const updated = await User.findByIdAndUpdate(
        deposit.userId,
        { $inc: { walletBalance: deposit.amountNGN } },
        { new: true }
      ).select("walletBalance");
      newBalance = updated?.walletBalance ?? null;
    }

    deposit.status     = newStatus;
    deposit.reviewedAt = new Date();
    if (note) deposit.adminNote = note;
    await deposit.save();

    return NextResponse.json({
      success: true,
      deposit: {
        id:         deposit._id.toString(),
        status:     deposit.status,
        adminNote:  deposit.adminNote ?? "",
        reviewedAt: deposit.reviewedAt ? deposit.reviewedAt.toISOString() : null,
      },
      ...(newBalance !== null ? { newWalletBalance: newBalance } : {}),
    });
  } catch (err) {
    console.error("[POST /api/admin/deposits/[id]/decision]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
