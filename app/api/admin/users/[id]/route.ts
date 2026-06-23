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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?234|0)[789][01]\d{8}$/;
const ACCT_RE  = /^\d{10}$/;

type UserUpdates = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  walletBalance?: number;
  bankDetails?: { accountNumber: string; bankName: string; nameOnBank: string };
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as Partial<UserUpdates> | null;
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  // ── Validate ─────────────────────────────────────────────────────────────
  const updates: Record<string, unknown> = {};

  if (body.firstName !== undefined) {
    const v = String(body.firstName).trim();
    if (!v || v.length > 50) return NextResponse.json({ success: false, message: "Invalid first name." }, { status: 400 });
    updates.firstName = v;
  }
  if (body.lastName !== undefined) {
    const v = String(body.lastName).trim();
    if (!v || v.length > 50) return NextResponse.json({ success: false, message: "Invalid last name." }, { status: 400 });
    updates.lastName = v;
  }
  if (body.email !== undefined) {
    const v = String(body.email).trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return NextResponse.json({ success: false, message: "Invalid email." }, { status: 400 });
    updates.email = v;
  }
  if (body.phone !== undefined) {
    const v = String(body.phone).trim();
    if (!PHONE_RE.test(v)) return NextResponse.json({ success: false, message: "Invalid Nigerian phone number." }, { status: 400 });
    updates.phone = v;
  }
  if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
  if (body.isEmailVerified !== undefined) updates.isEmailVerified = Boolean(body.isEmailVerified);
  if (body.walletBalance !== undefined) {
    const n = Number(body.walletBalance);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ success: false, message: "Invalid wallet balance." }, { status: 400 });
    updates.walletBalance = n;
  }
  if (body.bankDetails !== undefined) {
    const b = body.bankDetails;
    if (!b || !ACCT_RE.test(String(b.accountNumber ?? "")) || !String(b.bankName ?? "").trim() || !String(b.nameOnBank ?? "").trim()) {
      return NextResponse.json({ success: false, message: "Bank details: 10-digit account, bank name, and name on bank are required." }, { status: 400 });
    }
    updates.bankDetails = {
      accountNumber: String(b.accountNumber).trim(),
      bankName:      String(b.bankName).trim(),
      nameOnBank:    String(b.nameOnBank).trim(),
    };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "No changes provided." }, { status: 400 });
  }

  try {
    await connectDB();

    // Guard against duplicate email / phone
    if (updates.email || updates.phone) {
      const conflict = await User.findOne({
        _id: { $ne: id },
        $or: [
          updates.email ? { email: updates.email } : null,
          updates.phone ? { phone: updates.phone } : null,
        ].filter(Boolean) as Record<string, unknown>[],
      }).select("email phone").lean();
      if (conflict) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = conflict as any;
        const field = c.email === updates.email ? "Email" : "Phone";
        return NextResponse.json({ success: false, message: `${field} already in use by another user.` }, { status: 409 });
      }
    }

    const updated = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated.toJSON() });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findById(id).lean() as AnyDoc | null;
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const uid = user._id;

    const [
      tradeCount, recoveryCount, consignmentCount, editingCount, lipsyncCount, fundCount,
      recentTrades, recentRecovery, recentConsignment, recentEditing, recentLipsync, recentFunds,
    ] = await Promise.all([
      TradeOrder.countDocuments({ userId: uid }),
      RecoveryRequest.countDocuments({ userId: uid }),
      ConsignmentOrder.countDocuments({ userId: uid }),
      EditingOrder.countDocuments({ userId: uid }),
      LipsyncOrder.countDocuments({ userId: uid }),
      FundRequest.countDocuments({ userId: uid }),
      TradeOrder.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      RecoveryRequest.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      ConsignmentOrder.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      EditingOrder.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      LipsyncOrder.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
      FundRequest.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const normalise = (
      docs: AnyDoc[],
      type: string,
      typeKey: string,
      descFn: (o: AnyDoc) => string,
      amountFn: (o: AnyDoc) => number,
    ) => docs.map((o) => ({
      id: o._id.toString(),
      type,
      typeKey,
      description: descFn(o),
      amount:      amountFn(o),
      status:      o.status,
      date:        o.createdAt,
    }));

    const recentOrders = [
      ...normalise(recentTrades      as AnyDoc[], "Trade",        "trade",       (o) => `${o.brand} ${o.currencySymbol ?? "$"}${o.cardValue ?? o.cardValueUSD}`,                (o) => o.payoutNGN),
      ...normalise(recentRecovery    as AnyDoc[], "Recovery",     "recovery",    (o) => `${o.brand} ${o.currencySymbol ?? "$"}${o.cardValue ?? o.cardValueUSD} — ${o.issueType}`, (o) => o.payoutNGN),
      ...normalise(recentConsignment as AnyDoc[], "Consignment",  "consignment", (o) => o.boxDescription?.slice(0, 60) ?? "Consignment",(o) => o.feeChargedNGN),
      ...normalise(recentEditing     as AnyDoc[], "Editing",      "editing",     (o) => o.editDescription?.slice(0, 60) ?? "Editing",   (o) => o.feeChargedNGN),
      ...normalise(recentLipsync     as AnyDoc[], "Lipsync",      "lipsync",     (o) => o.lipsyncDescription?.slice(0, 60) ?? "Lipsync",(o) => o.feeChargedNGN),
      ...normalise(recentFunds       as AnyDoc[], "Fund Request", "fund",        (_o) => "Wallet top-up",                                (o) => o.amountNGN),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    delete user.passwordHash;

    return NextResponse.json({
      success: true,
      user: {
        id:              user._id.toString(),
        firstName:       user.firstName,
        lastName:        user.lastName,
        name:            `${user.firstName} ${user.lastName}`,
        email:           user.email,
        phone:           user.phone,
        isEmailVerified: user.isEmailVerified,
        isActive:        user.isActive,
        role:            user.role,
        walletBalance:   user.walletBalance ?? 0,
        bankDetails:     user.bankDetails ?? null,
        lastLoginAt:     user.lastLoginAt,
        createdAt:       user.createdAt,
        updatedAt:       user.updatedAt,
      },
      counts: {
        trade:       tradeCount,
        recovery:    recoveryCount,
        consignment: consignmentCount,
        editing:     editingCount,
        lipsync:     lipsyncCount,
        fund:        fundCount,
        total:       tradeCount + recoveryCount + consignmentCount + editingCount + lipsyncCount + fundCount,
      },
      recentOrders,
    });
  } catch (err) {
    console.error("[GET /api/admin/users/[id]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
