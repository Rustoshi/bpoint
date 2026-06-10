import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FundRequest from "@/lib/models/FundRequest";
import { verifyAccessToken } from "@/lib/jwt";

const statusLabel: Record<string, string> = {
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
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

    const requests = await FundRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
    const fmtNGN = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

    const rows = requests.map((r) => ({
      id: String(r._id).slice(-6).toUpperCase(),
      amount: fmtNGN(r.amountNGN),
      date: fmt.format(new Date(r.createdAt)),
      status: statusLabel[r.status] ?? r.status,
      adminNote: r.adminNote ?? null,
      receiptUrl: r.receiptUrl,
    }));

    return NextResponse.json({ success: true, requests: rows });
  } catch (error) {
    console.error("[GET /api/fund/my-requests]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
