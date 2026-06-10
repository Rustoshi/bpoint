import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { verifyAccessToken } from "@/lib/jwt";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

function requireAdmin(req: NextRequest): boolean {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return false;
  try { return verifyAccessToken(token).role === "admin"; }
  catch { return false; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = Record<string, any>;

const fmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

function shape(m: AnyDoc) {
  return {
    id:                 String(m._id),
    fromAdmin:          Boolean(m.fromAdmin),
    body:               m.body as string,
    readAt:             m.readAt ? new Date(m.readAt).toISOString() : null,
    createdAt:          new Date(m.createdAt).toISOString(),
    createdAtFormatted: fmt.format(new Date(m.createdAt)),
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { userId } = await ctx.params;
  if (!mongoose.isValidObjectId(userId)) {
    return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findById(userId).select("firstName lastName email").lean() as AnyDoc | null;
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const messages = await Message.find({ userId })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean() as AnyDoc[];

    // Mark user→admin messages as read
    await Message.updateMany(
      { userId, fromAdmin: false, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      user: {
        id:    user._id.toString(),
        name:  `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      messages: messages.map(shape),
    });
  } catch (err) {
    console.error("[GET /api/admin/messages/[userId]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const { userId } = await ctx.params;
  if (!mongoose.isValidObjectId(userId)) {
    return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
  }

  const body = await req.json().catch(() => null) as { body?: string } | null;
  const trimmed = String(body?.body ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ success: false, message: "Message cannot be empty." }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ success: false, message: "Message cannot exceed 2000 characters." }, { status: 400 });
  }

  try {
    await connectDB();

    const exists = await User.exists({ _id: userId });
    if (!exists) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const message = await new Message({
      userId,
      fromAdmin: true,
      body: trimmed,
      readAt: null,
    }).save();

    return NextResponse.json({ success: true, message: shape(message.toObject()) });
  } catch (err) {
    console.error("[POST /api/admin/messages/[userId]]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
