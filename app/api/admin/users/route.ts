import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/lib/models/User";

function requireAdmin(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return false;
  try {
    const payload = verifyAccessToken(token);
    return payload.role === "admin";
  } catch { return false; }
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

const fmtNGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(n);

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    await connectDB();

    const raw = await User.find({ role: "user" })
      .select("firstName lastName email phone walletBalance isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const users = raw.map((u) => ({
      id: u._id.toString(),
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      balance: fmtNGN(u.walletBalance ?? 0),
      balanceRaw: u.walletBalance ?? 0,
      isActive: u.isActive,
      status: u.isActive ? "Active" : "Suspended",
      joined: fmtDate(u.createdAt),
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
