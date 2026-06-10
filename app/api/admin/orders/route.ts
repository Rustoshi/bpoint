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
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

function normalise(docs: AnyDoc[], type: string, descFn: (o: AnyDoc) => string, amountFn: (o: AnyDoc) => number, userMap: Map<string, AnyDoc>) {
  return docs.map((o) => {
    const u = userMap.get(o.userId.toString());
    return {
      id:          o._id.toString(),
      type,
      userId:      o.userId.toString(),
      userName:    u ? `${u.firstName} ${u.lastName}` : "Unknown",
      userEmail:   u?.email ?? "",
      description: descFn(o),
      amount:      fmtNGN(amountFn(o)),
      amountRaw:   amountFn(o),
      status:      o.status,
      adminNote:   o.adminNote ?? "",
      date:        o.createdAt,
      raw:         o,
    };
  });
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const typeFilter   = searchParams.get("type") ?? "all";   // all|trade|recovery|consignment|editing|lipsync|fund
  const statusFilter = searchParams.get("status") ?? "all"; // all|pending|active|done
  const q            = (searchParams.get("q") ?? "").trim().toLowerCase();
  const page         = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit        = Math.min(50, Number(searchParams.get("limit") ?? 20));

  try {
    await connectDB();

    // ── Status filter helpers ────────────────────────────────────────────────
    const activeStatuses: Record<string, string[]> = {
      trade:       ["reviewing"],
      recovery:    ["reviewing"],
      consignment: ["processing"],
      editing:     ["in-progress"],
      lipsync:     ["in-progress"],
      fund:        [],
    };
    const doneStatuses: Record<string, string[]> = {
      trade:       ["approved", "paid", "rejected"],
      recovery:    ["recovered", "unrecoverable", "cancelled"],
      consignment: ["delivered", "cancelled"],
      editing:     ["delivered", "cancelled"],
      lipsync:     ["delivered", "cancelled"],
      fund:        ["approved", "rejected"],
    };

    function buildQuery(key: string): Record<string, unknown> {
      if (statusFilter === "pending") return { status: "pending" };
      if (statusFilter === "active")  return { status: { $in: activeStatuses[key] } };
      if (statusFilter === "done")    return { status: { $in: doneStatuses[key] } };
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetch = (model: any, key: string) =>
      typeFilter !== "all" && typeFilter !== key
        ? Promise.resolve([])
        : model.find(buildQuery(key)).sort({ createdAt: -1 }).lean();

    const [trades, recovery, consignment, editing, lipsync, funds] = await Promise.all([
      fetch(TradeOrder,       "trade"),
      fetch(RecoveryRequest,  "recovery"),
      fetch(ConsignmentOrder, "consignment"),
      fetch(EditingOrder,     "editing"),
      fetch(LipsyncOrder,     "lipsync"),
      fetch(FundRequest,      "fund"),
    ]);

    // ── Resolve user names ───────────────────────────────────────────────────
    const allDocs = [...trades, ...recovery, ...consignment, ...editing, ...lipsync, ...funds] as AnyDoc[];
    const userIds = [...new Set(allDocs.map((o) => o.userId.toString()))];
    const users   = await User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const all = [
      ...normalise(trades      as AnyDoc[], "Trade",        (o) => `${o.brand} $${o.cardValueUSD}`, (o) => o.payoutNGN,   userMap),
      ...normalise(recovery    as AnyDoc[], "Recovery",     (o) => `${o.brand} — ${o.issueType}`,   (o) => o.feeChargedNGN, userMap),
      ...normalise(consignment as AnyDoc[], "Consignment",  (o) => o.boxDescription?.slice(0, 80),  (o) => o.feeChargedNGN, userMap),
      ...normalise(editing     as AnyDoc[], "Editing",      (o) => o.editDescription?.slice(0, 80), (o) => o.feeChargedNGN, userMap),
      ...normalise(lipsync     as AnyDoc[], "Lipsync",      (o) => o.lipsyncDescription?.slice(0, 80), (o) => o.feeChargedNGN, userMap),
      ...normalise(funds       as AnyDoc[], "Fund Request", (_o) => "Wallet top-up",                (o) => o.amountNGN,   userMap),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = q
      ? all.filter((o) =>
          o.id.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          (o.description ?? "").toLowerCase().includes(q)
        )
      : all;

    const total  = filtered.length;
    const paged  = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ success: true, orders: paged, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
