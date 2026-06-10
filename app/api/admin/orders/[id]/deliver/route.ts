import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import ConsignmentOrder from "@/lib/models/ConsignmentOrder";
import EditingOrder from "@/lib/models/EditingOrder";
import LipsyncOrder from "@/lib/models/LipsyncOrder";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONFIG: Record<string, { model: mongoose.Model<any>; field: "deliveryUrl" | "proofVideoUrl" }> = {
  consignment: { model: ConsignmentOrder, field: "proofVideoUrl" },
  editing:     { model: EditingOrder,     field: "deliveryUrl" },
  lipsync:     { model: LipsyncOrder,     field: "deliveryUrl" },
};

const URL_RE = /^https?:\/\/\S+$/i;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid order id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as { type?: string; deliveryUrl?: string } | null;
  if (!body || !body.type || !CONFIG[body.type]) {
    return NextResponse.json({ success: false, message: "Type must be consignment, editing, or lipsync." }, { status: 400 });
  }

  const url = (body.deliveryUrl ?? "").trim();
  if (!url || !URL_RE.test(url)) {
    return NextResponse.json({ success: false, message: "A valid http(s) URL is required." }, { status: 400 });
  }

  try {
    await connectDB();
    const { model, field } = CONFIG[body.type];
    const order = await model.findByIdAndUpdate(
      id,
      { $set: { [field]: url } },
      { new: true }
    );
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, order: order.toJSON() });
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]/deliver]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
