import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FundRequest from "@/lib/models/FundRequest";
import TradeOrder from "@/lib/models/TradeOrder";
import RecoveryRequest from "@/lib/models/RecoveryRequest";
import ConsignmentOrder from "@/lib/models/ConsignmentOrder";
import EditingOrder from "@/lib/models/EditingOrder";
import LipsyncOrder from "@/lib/models/LipsyncOrder";
import { verifyAccessToken } from "@/lib/jwt";

export type TxType =
  | "deposit"
  | "trade"
  | "recovery"
  | "consignment"
  | "editing"
  | "lipsync";

export type TxEntry = {
  id: string;
  type: TxType;
  typeLabel: string;
  description: string;
  amountNGN: number;
  amountFormatted: string;
  direction: "credit" | "debit";
  status: string;
  date: string;
  rawDate: string;
};

const fmtDate = new Intl.DateTimeFormat("en-NG", {
  day: "numeric", month: "short", year: "numeric",
});
const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);

const depositStatus: Record<string, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected",
};
const tradeStatus: Record<string, string> = {
  pending: "Pending", reviewing: "Reviewing", approved: "Approved", paid: "Paid", rejected: "Rejected",
};
const serviceStatus: Record<string, string> = {
  pending: "Pending", "in-progress": "In Progress", delivered: "Delivered",
  reviewing: "Reviewing", recovered: "Recovered", unrecoverable: "Unrecoverable",
  processing: "Processing", cancelled: "Cancelled", completed: "Completed",
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

    const [funds, trades, recoveries, consignments, editings, lipsyncs] = await Promise.all([
      FundRequest.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
      TradeOrder.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
      RecoveryRequest.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
      ConsignmentOrder.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
      EditingOrder.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
      LipsyncOrder.find({ userId }).sort({ createdAt: -1 }).limit(200).lean(),
    ]);

    const entries: TxEntry[] = [];

    // ── Deposits ─────────────────────────────────────────────────────────────
    for (const f of funds) {
      entries.push({
        id: String(f._id).slice(-7).toUpperCase(),
        type: "deposit",
        typeLabel: "Deposit",
        description: "Wallet fund request",
        amountNGN: f.amountNGN,
        amountFormatted: fmtNGN(f.amountNGN),
        direction: "credit",
        status: depositStatus[f.status] ?? f.status,
        date: fmtDate.format(new Date(f.createdAt)),
        rawDate: f.createdAt.toISOString(),
      });
    }

    // ── Gift card trades ──────────────────────────────────────────────────────
    for (const t of trades) {
      entries.push({
        id: String(t._id).slice(-7).toUpperCase(),
        type: "trade",
        typeLabel: "Gift Card Trade",
        description: `${t.brand} · $${t.cardValueUSD}`,
        amountNGN: t.payoutNGN,
        amountFormatted: fmtNGN(t.payoutNGN),
        direction: "credit",
        status: tradeStatus[t.status] ?? t.status,
        date: fmtDate.format(new Date(t.createdAt)),
        rawDate: t.createdAt.toISOString(),
      });
    }

    // ── Recovery requests ─────────────────────────────────────────────────────
    for (const r of recoveries) {
      entries.push({
        id: String(r._id).slice(-7).toUpperCase(),
        type: "recovery",
        typeLabel: "Code Recovery",
        description: `${r.brand} · $${r.cardValueUSD} card`,
        amountNGN: r.feeChargedNGN,
        amountFormatted: fmtNGN(r.feeChargedNGN),
        direction: "debit",
        status: serviceStatus[r.status] ?? r.status,
        date: fmtDate.format(new Date(r.createdAt)),
        rawDate: r.createdAt.toISOString(),
      });
    }

    // ── Consignment orders ────────────────────────────────────────────────────
    for (const c of consignments) {
      entries.push({
        id: String(c._id).slice(-7).toUpperCase(),
        type: "consignment",
        typeLabel: "Consignment Proof",
        description: c.boxDescription.length > 60
          ? c.boxDescription.slice(0, 60) + "…"
          : c.boxDescription,
        amountNGN: c.feeChargedNGN,
        amountFormatted: fmtNGN(c.feeChargedNGN),
        direction: "debit",
        status: serviceStatus[c.status] ?? c.status,
        date: fmtDate.format(new Date(c.createdAt)),
        rawDate: c.createdAt.toISOString(),
      });
    }

    // ── Editing orders ────────────────────────────────────────────────────────
    for (const e of editings) {
      entries.push({
        id: String(e._id).slice(-7).toUpperCase(),
        type: "editing",
        typeLabel: "Editing Service",
        description: e.editDescription.length > 60
          ? e.editDescription.slice(0, 60) + "…"
          : e.editDescription,
        amountNGN: e.feeChargedNGN,
        amountFormatted: fmtNGN(e.feeChargedNGN),
        direction: "debit",
        status: serviceStatus[e.status] ?? e.status,
        date: fmtDate.format(new Date(e.createdAt)),
        rawDate: e.createdAt.toISOString(),
      });
    }

    // ── Lipsync orders ────────────────────────────────────────────────────────
    for (const l of lipsyncs) {
      entries.push({
        id: String(l._id).slice(-7).toUpperCase(),
        type: "lipsync",
        typeLabel: "Lipsync Video",
        description: l.lipsyncDescription.length > 60
          ? l.lipsyncDescription.slice(0, 60) + "…"
          : l.lipsyncDescription,
        amountNGN: l.feeChargedNGN,
        amountFormatted: fmtNGN(l.feeChargedNGN),
        direction: "debit",
        status: serviceStatus[l.status] ?? l.status,
        date: fmtDate.format(new Date(l.createdAt)),
        rawDate: l.createdAt.toISOString(),
      });
    }

    // Sort all entries newest first
    entries.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error("[GET /api/payment-history]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
