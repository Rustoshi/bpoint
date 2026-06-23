import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TradeOrder from "@/lib/models/TradeOrder";
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

    const orders = await TradeOrder.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
    const fmtNGN = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

    const rows = orders.map((o) => ({
      id: String(o._id).slice(-6).toUpperCase(),
      brand: o.brand,
      amount: `${o.currencySymbol ?? "$"}${o.cardValue ?? (o as { cardValueUSD?: number }).cardValueUSD ?? 0}`,
      rate: `₦${o.rateSnapshot.toLocaleString()}`,
      payout: fmtNGN(o.payoutNGN),
      date: fmt.format(new Date(o.createdAt)),
      status: capitalize(o.status),
    }));

    return NextResponse.json({ success: true, trades: rows });
  } catch (error) {
    console.error("[GET /api/dashboard/trades]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

function capitalize(s: string) {
  if (s === "paid") return "Paid out";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
