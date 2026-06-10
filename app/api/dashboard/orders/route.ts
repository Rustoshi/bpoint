import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ServiceOrder from "@/lib/models/ServiceOrder";
import { verifyAccessToken } from "@/lib/jwt";

const typeLabels: Record<string, string> = {
  lipsync: "Lipsync",
  editing: "Editing",
  consignment: "Consignment",
  "code-recovery": "Code Recovery",
};

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      return NextResponse.json({ success: false, message: "Session expired." }, { status: 401 });
    }

    await connectDB();

    const orders = await ServiceOrder.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const fmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

    const rows = orders.map((o) => ({
      id: String(o._id).slice(-6).toUpperCase(),
      type: typeLabels[o.type] ?? o.type,
      description: o.description,
      submittedAt: fmt.format(new Date(o.createdAt)),
      updatedAt: fmt.format(new Date(o.updatedAt)),
      status: capitalize(o.status),
    }));

    return NextResponse.json({ success: true, orders: rows });
  } catch (error) {
    console.error("[GET /api/dashboard/orders]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
