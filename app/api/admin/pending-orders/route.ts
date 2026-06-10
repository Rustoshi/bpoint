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

function requireAdmin(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return false;
  try {
    const payload = verifyAccessToken(token);
    return payload.role === "admin";
  } catch { return false; }
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    await connectDB();

    const LIMIT = 100;

    const [trades, recovery, consignment, editing, lipsync, funds] = await Promise.all([
      TradeOrder.find({ status: { $in: ["pending", "reviewing"] as const } })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      RecoveryRequest.find({ status: { $in: ["pending", "reviewing"] as const } })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      ConsignmentOrder.find({ status: { $in: ["pending", "processing"] as const } })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      EditingOrder.find({ status: { $in: ["pending", "in-progress"] as const } })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      LipsyncOrder.find({ status: { $in: ["pending", "in-progress"] as const } })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
      FundRequest.find({ status: "pending" as const })
        .sort({ createdAt: -1 }).limit(LIMIT).lean(),
    ]);

    // Collect all unique userIds
    const userIds = new Set([
      ...trades.map((o) => o.userId.toString()),
      ...recovery.map((o) => o.userId.toString()),
      ...consignment.map((o) => o.userId.toString()),
      ...editing.map((o) => o.userId.toString()),
      ...lipsync.map((o) => o.userId.toString()),
      ...funds.map((o) => o.userId.toString()),
    ]);

    const users = await User.find({ _id: { $in: [...userIds] } })
      .select("firstName lastName email").lean();

    const userMap = new Map(users.map((u) => [
      u._id.toString(),
      `${u.firstName} ${u.lastName}`,
    ]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type AnyDoc = Record<string, any>;

    const normalize = (arr: AnyDoc[], type: string, descFn: (o: AnyDoc) => string, amountFn: (o: AnyDoc) => number) =>
      arr.map((o) => ({
        id: o._id.toString(),
        type,
        userId: o.userId.toString(),
        userName: userMap.get(o.userId.toString()) ?? "Unknown",
        description: descFn(o),
        amount: fmtNGN(amountFn(o)),
        amountRaw: amountFn(o),
        status: o.status,
        date: fmtDate(o.createdAt),
        rawDate: o.createdAt,
      }));

    const toAny = (arr: unknown): AnyDoc[] => arr as AnyDoc[];

    const orders = [
      ...normalize(toAny(trades),      "Trade",        (o) => `${o.brand} $${o.cardValueUSD}`,              (o) => o.payoutNGN),
      ...normalize(toAny(recovery),    "Recovery",     (o) => `${o.brand} — ${o.issueType}`,                (o) => o.feeChargedNGN),
      ...normalize(toAny(consignment), "Consignment",  (o) => o.boxDescription?.slice(0, 60) ?? "Consignment order", (o) => o.feeChargedNGN),
      ...normalize(toAny(editing),     "Editing",      (o) => o.editDescription?.slice(0, 60) ?? "Editing order",    (o) => o.feeChargedNGN),
      ...normalize(toAny(lipsync),     "Lipsync",      (o) => o.lipsyncDescription?.slice(0, 60) ?? "Lipsync order", (o) => o.feeChargedNGN),
      ...normalize(toAny(funds),       "Fund Request", (_o) => `Wallet top-up`,                             (o) => o.amountNGN),
    ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
     .map(({ rawDate, ...rest }) => rest);

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("[GET /api/admin/pending-orders]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
