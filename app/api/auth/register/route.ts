import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, accountNumber, bankName, nameOnBank, password } = body;

    // ── Basic presence validation ───────────────────────────
    const missing = ["firstName", "lastName", "email", "phone", "accountNumber", "bankName", "nameOnBank", "password"]
      .filter((k) => !body[k]?.toString().trim());

    if (missing.length) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Format validation ───────────────────────────────────
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email address" }, { status: 400 });
    }

    if (!/^(\+?234|0)[789][01]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ success: false, message: "Invalid Nigerian phone number" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ success: false, message: "Account number must be 10 digits" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();

    // ── Duplicate check ─────────────────────────────────────
    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email: email.toLowerCase().trim() }).lean(),
      User.findOne({ phone: phone.trim() }).lean(),
    ]);

    if (emailExists) {
      return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 409 });
    }
    if (phoneExists) {
      return NextResponse.json({ success: false, message: "An account with this phone number already exists" }, { status: 409 });
    }

    // ── Hash password ───────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Create user (auto-verified — no OTP step) ──────────
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      isEmailVerified: true,
      bankDetails: {
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        nameOnBank: nameOnBank.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. You can now log in.",
        data: { email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
