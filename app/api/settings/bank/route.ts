import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  let userId: string;
  try { userId = verifyAccessToken(token).sub; } catch {
    return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findById(userId).select("bankDetails").lean();
    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    return NextResponse.json({ success: true, bankDetails: user.bankDetails ?? {} });
  } catch (error) {
    console.error("[GET /api/settings/bank]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  let userId: string;
  try { userId = verifyAccessToken(token).sub; } catch {
    return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
  }
  try {
    const { accountNumber, bankName, nameOnBank } = await req.json();

    if (!accountNumber?.trim()) {
      return NextResponse.json({ success: false, message: "Account number is required." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(accountNumber.trim())) {
      return NextResponse.json({ success: false, message: "Account number must be exactly 10 digits." }, { status: 400 });
    }
    if (!bankName?.trim()) {
      return NextResponse.json({ success: false, message: "Bank name is required." }, { status: 400 });
    }
    if (!nameOnBank?.trim()) {
      return NextResponse.json({ success: false, message: "Name on account is required." }, { status: 400 });
    }

    await connectDB();

    await User.findByIdAndUpdate(userId, {
      bankDetails: {
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        nameOnBank: nameOnBank.trim(),
      },
    });

    return NextResponse.json({ success: true, message: "Bank details updated successfully." });
  } catch (error) {
    console.error("[PATCH /api/settings/bank]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
