import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import { verifyAccessToken } from "@/lib/jwt";

function auth(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

// ── GET — fetch thread & mark admin messages as read ──────────────────────────
export async function GET(req: NextRequest) {
  const userId = auth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  try {
    await connectDB();

    const messages = await Message.find({ userId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Mark all unread admin messages as read
    await Message.updateMany(
      { userId, fromAdmin: true, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const fmt = new Intl.DateTimeFormat("en-NG", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const rows = messages.map((m) => ({
      id: String(m._id),
      fromAdmin: m.fromAdmin,
      body: m.body,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      createdAtFormatted: fmt.format(new Date(m.createdAt)),
    }));

    return NextResponse.json({ success: true, messages: rows });
  } catch (error) {
    console.error("[GET /api/messages]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

// ── POST — user sends a message to admin ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = auth(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  try {
    const { body } = await req.json();
    const trimmed = String(body ?? "").trim();

    if (!trimmed) {
      return NextResponse.json({ success: false, message: "Message cannot be empty." }, { status: 400 });
    }
    if (trimmed.length > 2000) {
      return NextResponse.json({ success: false, message: "Message cannot exceed 2000 characters." }, { status: 400 });
    }

    await connectDB();

    const message = await new Message({
      userId,
      fromAdmin: false,
      body: trimmed,
      readAt: null,
    }).save();

    const fmt = new Intl.DateTimeFormat("en-NG", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    return NextResponse.json({
      success: true,
      message: {
        id: String(message._id),
        fromAdmin: false,
        body: message.body,
        readAt: null,
        createdAt: message.createdAt.toISOString(),
        createdAtFormatted: fmt.format(new Date(message.createdAt)),
      },
    });
  } catch (error) {
    console.error("[POST /api/messages]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
