import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyAccessToken } from "@/lib/jwt";

function getAuth(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try { return verifyAccessToken(token).sub; } catch { return null; }
}

// ── GET — return current profile data ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = getAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findById(userId)
      .select("firstName lastName email phone bankDetails")
      .lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("[GET /api/settings/profile]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

// ── PATCH — update personal info (no email) ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  const userId = getAuth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { firstName, lastName, phone } = body;

    if (!firstName?.trim()) {
      return NextResponse.json({ success: false, message: "First name is required." }, { status: 400 });
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ success: false, message: "Last name is required." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ success: false, message: "Phone number is required." }, { status: 400 });
    }
    if (!/^(\+?234|0)[789][01]\d{8}$/.test(phone.trim().replace(/\s/g, ""))) {
      return NextResponse.json({ success: false, message: "Enter a valid Nigerian phone number." }, { status: 400 });
    }

    await connectDB();

    // Check phone uniqueness (exclude self)
    const phoneConflict = await User.findOne({ phone: phone.trim(), _id: { $ne: userId } }).lean();
    if (phoneConflict) {
      return NextResponse.json({ success: false, message: "This phone number is already in use." }, { status: 409 });
    }

    await User.findByIdAndUpdate(userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    console.error("[PATCH /api/settings/profile]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
