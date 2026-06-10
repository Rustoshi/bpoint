import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import OtpToken from "@/lib/models/OtpToken";
import { generateOtp, hashOtp, otpExpiresAt } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

// Minimum gap between resend requests (60 seconds)
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Return success to avoid email enumeration
      return NextResponse.json(
        { success: true, message: "If an account exists, a new code has been sent." },
        { status: 200 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "This email is already verified." },
        { status: 400 }
      );
    }

    // ── Cooldown check ──────────────────────────────────────
    const existing = await OtpToken.findOne({
      userId: user._id,
      purpose: "email_verification",
    });

    if (existing) {
      const createdAt = existing.createdAt instanceof Date ? existing.createdAt : new Date(existing.createdAt);
      const elapsed = Date.now() - createdAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { success: false, message: `Please wait ${waitSecs} seconds before requesting a new code.` },
          { status: 429 }
        );
      }
      await OtpToken.deleteOne({ _id: existing._id });
    }

    // ── Generate new OTP ────────────────────────────────────
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await OtpToken.create({
      userId: user._id,
      email: user.email,
      otpHash,
      purpose: "email_verification",
      expiresAt: otpExpiresAt(),
    });

    await sendOtpEmail(user.email, user.firstName, otp);

    return NextResponse.json(
      { success: true, message: "A new verification code has been sent to your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/resend-otp]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
