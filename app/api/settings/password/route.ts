import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/jwt";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function PATCH(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "All password fields are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, message: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: "New passwords do not match." }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, message: "New password must be different from your current password." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select("passwordHash");
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.findByIdAndUpdate(userId, { passwordHash: newHash });

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("[PATCH /api/settings/password]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
