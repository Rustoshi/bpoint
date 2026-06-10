import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

const COOKIE_MAX_AGE_DAYS = Number(process.env.COOKIE_MAX_AGE_DAYS ?? 7);
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, method } = body;

    // identifier = email or phone, method = "email" | "phone"
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email/phone and password are required" },
        { status: 400 }
      );
    }

    if (!["email", "phone"].includes(method)) {
      return NextResponse.json(
        { success: false, message: "Invalid login method" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── Find user ───────────────────────────────────────────
    const query =
      method === "email"
        ? { email: identifier.toLowerCase().trim() }
        : { phone: identifier.trim() };

    const user = await User.findOne(query).select("+passwordHash");

    // Use generic message to prevent user enumeration
    const INVALID_MSG = "Invalid credentials. Please check your details and try again.";

    if (!user) {
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // ── Account active check ────────────────────────────────
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // ── Password check ──────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    // ── Issue tokens ────────────────────────────────────────
    const tokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Update last login
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    // ── Set refresh token as HttpOnly cookie ────────────────
    const res = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            walletBalance: user.walletBalance,
            isEmailVerified: user.isEmailVerified,
          },
        },
      },
      { status: 200 }
    );

    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
