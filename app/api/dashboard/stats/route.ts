import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TradeOrder from "@/lib/models/TradeOrder";
import Message from "@/lib/models/Message";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
    }

    await connectDB();

    const [pendingOrders, unreadMessages] = await Promise.all([
      TradeOrder.countDocuments({ userId, status: { $in: ["pending", "reviewing"] } }),
      Message.countDocuments({ userId, fromAdmin: true, readAt: null }),
    ]);

    return NextResponse.json({ success: true, pendingOrders, unreadMessages });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
