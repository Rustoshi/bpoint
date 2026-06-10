import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

const VALID_STATUSES: Record<string, string[]> = {
  trade:       ["pending", "reviewing", "approved", "paid", "rejected"],
  recovery:    ["pending", "reviewing", "recovered", "unrecoverable", "cancelled"],
  consignment: ["pending", "processing", "delivered", "cancelled"],
  editing:     ["pending", "in-progress", "delivered", "cancelled"],
  lipsync:     ["pending", "in-progress", "delivered", "cancelled"],
  fund:        ["pending", "approved", "rejected"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELS: Record<string, mongoose.Model<any>> = {
  trade:       TradeOrder,
  recovery:    RecoveryRequest,
  consignment: ConsignmentOrder,
  editing:     EditingOrder,
  lipsync:     LipsyncOrder,
  fund:        FundRequest,
};

const TERMINAL_DATE_FIELD: Record<string, string> = {
  trade:       "reviewedAt",
  recovery:    "resolvedAt",
  consignment: "resolvedAt",
  editing:     "resolvedAt",
  lipsync:     "resolvedAt",
  fund:        "reviewedAt",
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid order id." }, { status: 400 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "";
  if (!MODELS[type]) {
    return NextResponse.json({ success: false, message: "Missing or invalid order type." }, { status: 400 });
  }

  try {
    await connectDB();
    const order = await MODELS[type].findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = order as any;
    const user = await User.findById(o.userId).select("firstName lastName email").lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = user as any;
    return NextResponse.json({
      success: true,
      order: o,
      user: u ? { id: u._id.toString(), name: `${u.firstName} ${u.lastName}`, email: u.email } : null,
    });
  } catch (err) {
    console.error("[GET /api/admin/orders/[id]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid order id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as { type?: string; status?: string; adminNote?: string } | null;
  if (!body || !body.type || !MODELS[body.type]) {
    return NextResponse.json({ success: false, message: "Missing or invalid order type." }, { status: 400 });
  }

  const { type, status, adminNote } = body;

  if (status && !VALID_STATUSES[type].includes(status)) {
    return NextResponse.json({ success: false, message: `Invalid status '${status}' for type '${type}'.` }, { status: 400 });
  }

  try {
    await connectDB();
    const Model = MODELS[type];
    const order = await Model.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const previousStatus = order.status;

    // Fund approval — credit user wallet once on transition to approved
    if (type === "fund" && status === "approved" && previousStatus !== "approved") {
      await User.findByIdAndUpdate(order.userId, {
        $inc: { walletBalance: order.amountNGN },
      });
    }

    if (status) {
      order.status = status;
      const dateField = TERMINAL_DATE_FIELD[type];
      if (type === "trade" && status === "paid") {
        order.paidAt = new Date();
      } else if (dateField) {
        order[dateField] = new Date();
      }
    }

    if (typeof adminNote === "string") {
      order.adminNote = adminNote;
    }

    await order.save();

    return NextResponse.json({ success: true, order: order.toJSON() });
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
