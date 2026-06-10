import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EditingOrder from "@/lib/models/EditingOrder";
import { verifyAccessToken } from "@/lib/jwt";

const statusLabel: Record<string, string> = {
  pending:     "Pending",
  "in-progress": "In Progress",
  delivered:   "Delivered",
  cancelled:   "Cancelled",
};

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

    const orders = await EditingOrder.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
    const fmtNGN = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

    const rows = orders.map((o) => ({
      id: String(o._id).slice(-6).toUpperCase(),
      editDescription: o.editDescription,
      filesCount: o.fileUrls.length,
      fee: fmtNGN(o.feeChargedNGN),
      date: fmt.format(new Date(o.createdAt)),
      status: statusLabel[o.status] ?? o.status,
      deliveryUrl: o.deliveryUrl ?? null,
      adminNote: o.adminNote ?? null,
    }));

    return NextResponse.json({ success: true, orders: rows });
  } catch (error) {
    console.error("[GET /api/editing/my-orders]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
