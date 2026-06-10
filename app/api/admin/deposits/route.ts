import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import FundRequest from "@/lib/models/FundRequest";
import User from "@/lib/models/User";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "pending"; // pending|approved|rejected|all
  const q            = (searchParams.get("q") ?? "").trim().toLowerCase();
  const page         = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit        = Math.min(50, Number(searchParams.get("limit") ?? 20));

  try {
    await connectDB();

    const match: Record<string, unknown> = { receiptUrl: { $ne: "ADMIN_CREDIT" } };
    if (statusFilter !== "all") match.status = statusFilter;

    const deposits = await FundRequest.find(match).sort({ createdAt: -1 }).lean() as AnyDoc[];

    const userIds = [...new Set(deposits.map((d) => d.userId.toString()))];
    const users   = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName email")
      .lean() as AnyDoc[];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const rows = deposits.map((d) => {
      const u = userMap.get(d.userId.toString());
      return {
        id:         d._id.toString(),
        userId:     d.userId.toString(),
        userName:   u ? `${u.firstName} ${u.lastName}` : "Unknown user",
        userEmail:  u?.email ?? "",
        amountNGN:  d.amountNGN as number,
        status:     d.status as string,
        receiptUrl: d.receiptUrl as string,
        adminNote:  (d.adminNote ?? "") as string,
        createdAt:  new Date(d.createdAt).toISOString(),
        reviewedAt: d.reviewedAt ? new Date(d.reviewedAt).toISOString() : null,
      };
    });

    const filtered = q
      ? rows.filter((r) =>
          r.id.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          String(r.amountNGN).includes(q)
        )
      : rows;

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ success: true, deposits: paged, total, page, limit });
  } catch (err) {
    console.error("[GET /api/admin/deposits]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
