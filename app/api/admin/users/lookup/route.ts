import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/lib/models/User";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ email })
      .select("firstName lastName email phone walletBalance isActive")
      .lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "No user with that email." }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = user as any;
    return NextResponse.json({
      success: true,
      user: {
        id:            u._id.toString(),
        name:          `${u.firstName} ${u.lastName}`,
        email:         u.email,
        phone:         u.phone,
        walletBalance: u.walletBalance ?? 0,
        isActive:      u.isActive,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/users/lookup]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
