import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import OtpToken from "@/lib/models/OtpToken";
import { verifyOtp } from "@/lib/otp";
import { sendWelcomeEmail } from "@/lib/mailer";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "OTP must be a 6-digit number" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Find user ───────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with this email" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "This email is already verified. Please log in." },
        { status: 400 }
      );
    }

    // ── Find OTP token ──────────────────────────────────────
    const token = await OtpToken.findOne({
      userId: user._id,
      purpose: "email_verification",
      expiresAt: { $gt: new Date() },
    });

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Check attempts ──────────────────────────────────────
    if (token.attempts >= MAX_ATTEMPTS) {
      await OtpToken.deleteOne({ _id: token._id });
      return NextResponse.json(
        { success: false, message: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // ── Verify OTP ──────────────────────────────────────────
    const isValid = await verifyOtp(otp, token.otpHash);

    if (!isValid) {
      await OtpToken.updateOne({ _id: token._id }, { $inc: { attempts: 1 } });
      const remaining = MAX_ATTEMPTS - token.attempts - 1;
      return NextResponse.json(
        {
          success: false,
          message: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Invalid code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // ── Mark email as verified ──────────────────────────────
    await Promise.all([
      User.updateOne({ _id: user._id }, { isEmailVerified: true }),
      OtpToken.deleteOne({ _id: token._id }),
    ]);

    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.firstName).catch((err) =>
      console.error("[verify-otp] Failed to send welcome email:", err)
    );

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/verify-otp]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
