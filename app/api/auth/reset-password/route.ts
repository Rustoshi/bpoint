import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import PasswordResetToken from "@/lib/models/PasswordResetToken";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Token, email and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    // ── Find valid (unexpired, unused) token ────────────────
    const record = await PasswordResetToken.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "This reset link has expired or already been used. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Verify token ────────────────────────────────────────
    const isValid = await bcrypt.compare(token, record.tokenHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Update password ─────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await Promise.all([
      User.updateOne({ _id: user._id }, { passwordHash }),
      PasswordResetToken.updateOne({ _id: record._id }, { usedAt: new Date() }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
