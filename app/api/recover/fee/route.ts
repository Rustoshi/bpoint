import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSiteConfig } from "@/lib/models/SiteConfig";

export async function GET() {
  try {
    await connectDB();
    const config = await getSiteConfig();
    return NextResponse.json({ success: true, feeNGN: config.recoveryFeeNGN });
  } catch (error) {
    console.error("[GET /api/recover/fee]", error);
    return NextResponse.json({ success: true, feeNGN: 500 }); // fallback
  }
}
