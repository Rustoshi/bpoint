import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RecoveryRequest from "@/lib/models/RecoveryRequest";
import { verifyAccessToken } from "@/lib/jwt";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  approved: "Approved",
  paid: "Paid out",
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

    const requests = await RecoveryRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
    const fmtNGN = (n: number) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

    const rows = requests.map((r) => ({
      id: String(r._id).slice(-6).toUpperCase(),
      brand: r.brand,
      cardValue: `$${r.cardValueUSD}`,
      issueType: formatIssueType(r.issueType),
      rate: `₦${(r.rateSnapshot ?? 0).toLocaleString()}`,
      payout: fmtNGN(r.payoutNGN ?? 0),
      date: fmt.format(new Date(r.createdAt)),
      status: statusLabel[r.status] ?? r.status,
    }));

    return NextResponse.json({ success: true, requests: rows });
  } catch (error) {
    console.error("[GET /api/recover/my-requests]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

function formatIssueType(t: string) {
  switch (t) {
    case "scratched-off":  return "Scratched Off";
    case "missing-code":   return "Missing Code";
    case "damaged-card":   return "Damaged Card";
    case "not-loading":    return "Not Loading";
    default:               return "Other";
  }
}
