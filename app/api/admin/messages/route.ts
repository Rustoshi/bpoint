import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();

  try {
    await connectDB();

    // Aggregate one row per user: last message + unread (user→admin) count
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          lastBody:      { $first: "$body" },
          lastFromAdmin: { $first: "$fromAdmin" },
          lastAt:        { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$fromAdmin", false] }, { $eq: ["$readAt", null] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
    ]) as AnyDoc[];

    const userIds = conversations.map((c) => c._id);
    const users   = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName email")
      .lean() as AnyDoc[];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const rows = conversations.map((c) => {
      const u = userMap.get(c._id.toString());
      return {
        userId:        c._id.toString(),
        userName:      u ? `${u.firstName} ${u.lastName}` : "Unknown user",
        userEmail:     u?.email ?? "",
        lastBody:      c.lastBody as string,
        lastFromAdmin: Boolean(c.lastFromAdmin),
        lastAt:        new Date(c.lastAt).toISOString(),
        unread:        c.unread as number,
      };
    });

    const filtered = q
      ? rows.filter((r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.lastBody.toLowerCase().includes(q)
        )
      : rows;

    return NextResponse.json({ success: true, conversations: filtered });
  } catch (err) {
    console.error("[GET /api/admin/messages]", err);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
