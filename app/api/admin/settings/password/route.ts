import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/lib/models/User";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function PATCH(req: NextRequest) {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  let adminId: string;
  try {
    const payload = verifyAccessToken(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
    }
    adminId = payload.sub;
  } catch {
    return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } | null;

  if (!body || !body.currentPassword || !body.newPassword || !body.confirmPassword) {
    return NextResponse.json({ success: false, message: "All password fields are required." }, { status: 400 });
  }
  if (body.newPassword.length < 8) {
    return NextResponse.json({ success: false, message: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ success: false, message: "New passwords do not match." }, { status: 400 });
  }
  if (body.currentPassword === body.newPassword) {
    return NextResponse.json({ success: false, message: "New password must be different from your current password." }, { status: 400 });
  }

  try {
    await connectDB();

    const admin = await User.findById(adminId).select("passwordHash role");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin account not found." }, { status: 404 });
    }

    const valid = await bcrypt.compare(body.currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(body.newPassword, SALT_ROUNDS);
    await User.findByIdAndUpdate(adminId, { passwordHash: newHash });

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("[PATCH /api/admin/settings/password]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
