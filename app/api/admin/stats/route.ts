import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/lib/models/User";
import TradeOrder from "@/lib/models/TradeOrder";
import RecoveryRequest from "@/lib/models/RecoveryRequest";
import ConsignmentOrder from "@/lib/models/ConsignmentOrder";
import EditingOrder from "@/lib/models/EditingOrder";
import LipsyncOrder from "@/lib/models/LipsyncOrder";
import FundRequest from "@/lib/models/FundRequest";
import Message from "@/lib/models/Message";

function requireAdmin(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return payload.role === "admin" ? payload.sub : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    await connectDB();

    const [
      totalUsers,
      pendingTrades,
      pendingRecovery,
      pendingConsignment,
      pendingEditing,
      pendingLipsync,
      pendingFunds,
      unreadMessages,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      TradeOrder.countDocuments({ status: { $in: ["pending", "reviewing"] as const } }),
      RecoveryRequest.countDocuments({ status: { $in: ["pending", "reviewing"] as const } }),
      ConsignmentOrder.countDocuments({ status: { $in: ["pending", "processing"] as const } }),
      EditingOrder.countDocuments({ status: { $in: ["pending", "in-progress"] as const } }),
      LipsyncOrder.countDocuments({ status: { $in: ["pending", "in-progress"] as const } }),
      FundRequest.countDocuments({ status: "pending" as const, receiptUrl: { $ne: "ADMIN_CREDIT" } }),
      Message.countDocuments({ fromAdmin: false, readAt: null }),
    ]);

    const pendingOrders =
      pendingTrades + pendingRecovery + pendingConsignment +
      pendingEditing + pendingLipsync;

    return NextResponse.json({
      success: true,
      stats: { totalUsers, pendingOrders, pendingDeposits: pendingFunds, unreadMessages },
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
