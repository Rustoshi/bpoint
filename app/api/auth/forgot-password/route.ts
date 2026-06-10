import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import PasswordResetToken from "@/lib/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/mailer";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
const EXPIRES_MINUTES = 30;
const RESEND_COOLDOWN_MS = 60 * 1000;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email address is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const SUCCESS_RESPONSE = NextResponse.json(
      {
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
      },
      { status: 200 }
    );

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return SUCCESS_RESPONSE;

    // ── Cooldown: prevent spamming ──────────────────────────
    const existing = await PasswordResetToken.findOne({ userId: user._id });
    if (existing) {
      const elapsed = Date.now() - new Date(existing.createdAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) return SUCCESS_RESPONSE;
      await PasswordResetToken.deleteOne({ _id: existing._id });
    }

    // ── Generate token ──────────────────────────────────────
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, user.firstName, resetUrl);

    return SUCCESS_RESPONSE;
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
